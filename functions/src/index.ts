/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from "firebase-functions";
import { onCall, onRequest } from "firebase-functions/v2/https";
import { onValueUpdated, onValueCreated, onValueDeleted } from "firebase-functions/database";
import { onDocumentUpdated, onDocumentCreated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { CloudTasksClient } from "@google-cloud/tasks";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Initialize Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

const TASKS_LOCATION = process.env.TASKS_LOCATION || "us-central1";
const MISSED_DOSE_QUEUE = process.env.MISSED_DOSE_QUEUE || "missed-dose-queue";
const CHECK_MISSED_DOSE_URL = process.env.CHECK_MISSED_DOSE_URL || ""; // Must be set via functions config
const MISSED_DOSE_SA_EMAIL = process.env.MISSED_DOSE_SA_EMAIL || ""; // Optional: use OIDC to secure HTTP target

const tasksClient = new CloudTasksClient();

async function resolveOwnerUserId(deviceID: string): Promise<string | null> {
  // Prefer a direct mapping on device
  try {
    const ownerSnap = await admin.database().ref(`devices/${deviceID}/ownerUserId`).get();
    const owner = ownerSnap.val();
    if (typeof owner === "string" && owner.length > 0) return owner;
  } catch (e) {
    logger.warn("ownerUserId not found on device node", { deviceID });
  }

  // Fallback: scan users to find who owns this device (simple, not ideal for very large datasets)
  const usersSnap = await admin.database().ref("users").get();
  const users = usersSnap.val() || {};
  for (const uid of Object.keys(users)) {
    const hasDevice = users[uid]?.devices?.[deviceID] === true;
    if (hasDevice) return uid;
  }
  return null;
}

export const onDeviceStatusUpdated = onValueUpdated({ ref: "/devices/{deviceID}/state/current_status" }, async (event) => {
  const deviceID = event.params.deviceID as string;
  const after = event.data.after.val();
  const before = event.data.before.val();

  logger.info("Device status updated", { deviceID, before, after });

  if (after !== "ALARM_SOUNDING") {
    return; // Only schedule checks when alarm is sounding
  }

  const userID = await resolveOwnerUserId(deviceID);
  if (!userID) {
    logger.error("Unable to resolve owner userId for device", { deviceID });
    return;
  }

  if (!CHECK_MISSED_DOSE_URL) {
    logger.error("CHECK_MISSED_DOSE_URL is not set. Cannot schedule task.");
    return;
  }

  const project = process.env.GCLOUD_PROJECT || process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG!).projectId : "";
  const parent = tasksClient.queuePath(project, TASKS_LOCATION, MISSED_DOSE_QUEUE);

  const payload = { deviceID, userID, scheduledAt: Date.now() };
  const task: any = {
    httpRequest: {
      httpMethod: "POST",
      url: CHECK_MISSED_DOSE_URL,
      headers: { "Content-Type": "application/json" },
      body: Buffer.from(JSON.stringify(payload)).toString("base64"),
    },
    scheduleTime: {
      seconds: Math.floor((Date.now() + 30 * 60 * 1000) / 1000), // 30 minutes
    },
  };

  if (MISSED_DOSE_SA_EMAIL) {
    task.httpRequest.oidcToken = {
      serviceAccountEmail: MISSED_DOSE_SA_EMAIL,
      audience: CHECK_MISSED_DOSE_URL,
    };
  }

  try {
    await tasksClient.createTask({ parent, task });
    logger.info("Scheduled missed-dose check task", { deviceID, userID });
  } catch (e: any) {
    logger.error("Failed to create Cloud Task", { error: e.message });
  }
});

export const checkMissedDose = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const { deviceID, userID } = req.body || {};
  if (!deviceID || !userID) {
    res.status(400).send("Missing deviceID/userID");
    return;
  }

  try {
    const statusSnap = await admin.database().ref(`devices/${deviceID}/state/current_status`).get();
    const status = statusSnap.val();

    if (status === "DOSE_TAKEN") {
      res.status(200).send("Dose already taken");
      return;
    }

    // Treat as missed if still ALARM_SOUNDING or not DOSE_TAKEN
    const now = new Date();
    const dayKey = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const timeKey = now.toISOString().slice(11, 16); // HH:mm

    await admin.database().ref(`adherence_logs/${userID}/${dayKey}/${timeKey}`).set({
      status: "OMITIDA",
      source: "DEVICE",
      ts: Date.now(),
      deviceID,
    });

    // Notify caregivers
    const caregiversSnap = await admin.database().ref(`users/${userID}/caregivers`).get();
    const caregivers = caregiversSnap.val() || {};
    const tokens: string[] = [];
    for (const caregiverID of Object.keys(caregivers)) {
      const tokSnap = await admin.database().ref(`users/${caregiverID}/fcmTokens`).get();
      const tokMap = tokSnap.val() || {};
      tokens.push(...Object.keys(tokMap));
    }

    if (tokens.length > 0) {
      await admin.messaging().sendMulticast({
        tokens,
        notification: {
          title: "Dosis omitida",
          body: `El paciente ${userID} ha omitido su dosis.`,
        },
        data: { deviceID, userID, type: "MISSED_DOSE" },
      });
    }

    res.status(200).send("Missed dose logged and notifications (if any) sent.");
  } catch (e: any) {
    logger.error("checkMissedDose error", { error: e.message });
    res.status(500).send("Internal error");
  }
});

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

/**
 * Mirror RTDB user-device link to Firestore for queryable relationships and access control.
 * Triggered when a client links a device at /users/{uid}/devices/{deviceID} = true.
 */
export const onUserDeviceLinked = onValueCreated({ ref: "/users/{uid}/devices/{deviceID}" }, async (event) => {
  const uid = event.params.uid as string;
  const deviceID = event.params.deviceID as string;

  try {
    // Determine user role from Firestore users/{uid}
    const userDoc = await admin.firestore().doc(`users/${uid}`).get();
    const role = (userDoc.get("role") || "patient") as "patient" | "caregiver";

    // Update Firestore devices/{deviceID}.linkedUsers map
    await admin.firestore().doc(`devices/${deviceID}`).set(
      {
        [`linkedUsers.${uid}`]: role,
        // Optionally set primaryPatientId when first patient links
        ...(role === "patient" ? { primaryPatientId: uid } : {}),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Create deviceLinks document for queryability and audit
    await admin.firestore().doc(`deviceLinks/${deviceID}_${uid}`).set(
      {
        deviceId: deviceID,
        userId: uid,
        role,
        status: "active",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: uid,
      },
      { merge: true }
    );

    // If this user is the patient and ownerUserId is not set on RTDB device node, set it server-side
    if (role === "patient") {
      const ownerSnap = await admin.database().ref(`devices/${deviceID}/ownerUserId`).get();
      if (!ownerSnap.exists()) {
        await admin.database().ref(`devices/${deviceID}/ownerUserId`).set(uid);
      }
    }

    logger.info("Mirrored user-device link to Firestore", { deviceID, uid, role });
  } catch (e: any) {
    logger.error("onUserDeviceLinked error", { error: e.message, deviceID, uid });
  }
});

/**
 * Mirror RTDB user-device unlink to Firestore: remove from linkedUsers and mark deviceLinks inactive.
 */
export const onUserDeviceUnlinked = onValueDeleted({ ref: "/users/{uid}/devices/{deviceID}" }, async (event) => {
  const uid = event.params.uid as string;
  const deviceID = event.params.deviceID as string;

  try {
    // Remove from linkedUsers map
    await admin.firestore().doc(`devices/${deviceID}`).set(
      {
        [`linkedUsers.${uid}`]: admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Mark deviceLinks inactive
    await admin.firestore().doc(`deviceLinks/${deviceID}_${uid}`).set(
      {
        status: "inactive",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    logger.info("Mirrored user-device unlink to Firestore", { deviceID, uid });
  } catch (e: any) {
    logger.error("onUserDeviceUnlinked error", { error: e.message, deviceID, uid });
  }
});

/**
 * Optional: When desiredConfig changes in Firestore devices/{deviceID}, mirror to RTDB /devices/{deviceID}/config
 * so the pillbox can consume it. This keeps RTDB as the live config while caregivers edit in Firestore.
 */
export const onDesiredConfigUpdated = onDocumentUpdated("devices/{deviceID}", async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();
  const deviceID = event.params.deviceID as string;

  if (!before || !after) return;

  const beforeCfg = JSON.stringify(before.desiredConfig || null);
  const afterCfg = JSON.stringify(after.desiredConfig || null);
  if (beforeCfg === afterCfg) return; // no change

  try {
    await admin.database().ref(`devices/${deviceID}/config`).update(after.desiredConfig || {});
    logger.info("Mirrored desiredConfig to RTDB", { deviceID });
  } catch (e: any) {
    logger.error("onDesiredConfigUpdated error", { error: e.message, deviceID });
  }
});

/**
 * Mirror RTDB device state to Firestore so the frontend can read battery and other
 * telemetry purely from Firestore. This makes the client Firestore-only while
 * devices continue to push realtime state to RTDB.
 */
export const onDeviceStateMirroredToFirestore = onValueUpdated({ ref: "/devices/{deviceID}/state" }, async (event) => {
  const deviceID = event.params.deviceID as string;
  const afterState = event.data.after.val() || {};

  // Resolve battery percentage across possible keys
  const rawBattery =
    afterState?.battery_level ??
    afterState?.battery ??
    afterState?.batteryPercent ??
    afterState?.battery_percentage ??
    null;

  // Normalize battery to percentage number if possible
  let batteryPercent: number | null = null;
  if (typeof rawBattery === "number") {
    batteryPercent = rawBattery > 1 ? Math.min(100, Math.max(0, Math.round(rawBattery))) : Math.round(rawBattery * 100);
  } else if (typeof rawBattery === "string") {
    const n = Number(rawBattery.replace(/[^0-9.]/g, ""));
    if (!isNaN(n)) batteryPercent = n > 1 ? Math.min(100, Math.max(0, Math.round(n))) : Math.round(n * 100);
  }

  try {
    await admin.firestore().doc(`devices/${deviceID}`).set(
      {
        lastKnownState: {
          battery: batteryPercent,
          batteryRaw: {
            battery_level: afterState?.battery_level ?? null,
            battery: afterState?.battery ?? null,
            batteryPercent: afterState?.batteryPercent ?? null,
            battery_percentage: afterState?.battery_percentage ?? null,
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    logger.info("Mirrored device state to Firestore lastKnownState", { deviceID, batteryPercent });
  } catch (e: any) {
    logger.error("onDeviceStateMirroredToFirestore error", { error: e.message, deviceID });
  }
});

/**
 * Firestore-only linking support: when a deviceLinks doc is created/activated,
 * mirror the relationship to RTDB and update devices/{deviceID}.linkedUsers.
 */
export const onDeviceLinkCreated = onDocumentCreated("deviceLinks/{linkId}", async (event) => {
  const after = event.data?.data();
  const linkId = event.params.linkId as string;
  if (!after) return;

  const userId = after.userId as string;
  const deviceId = after.deviceId as string;
  const status = (after.status || "active") as string;
  if (!userId || !deviceId) return;
  if (status !== "active") return;

  try {
    // Determine user role from Firestore users/{uid}
    const userDoc = await admin.firestore().doc(`users/${userId}`).get();
    const role = (userDoc.get("role") || "patient") as "patient" | "caregiver";

    // Update Firestore devices/{deviceID}.linkedUsers map
    await admin.firestore().doc(`devices/${deviceId}`).set(
      {
        [`linkedUsers.${userId}`]: role,
        ...(role === "patient" ? { primaryPatientId: userId } : {}),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Mirror to RTDB mapping used by legacy triggers/hardware
    await admin.database().ref(`users/${userId}/devices/${deviceId}`).set(true);

    // Ensure ownerUserId on RTDB device node
    if (role === "patient") {
      const ownerSnap = await admin.database().ref(`devices/${deviceId}/ownerUserId`).get();
      if (!ownerSnap.exists()) {
        await admin.database().ref(`devices/${deviceId}/ownerUserId`).set(userId);
      }
    }

    logger.info("Mirrored Firestore deviceLinks create to RTDB", { linkId, deviceId, userId, role });
  } catch (e: any) {
    logger.error("onDeviceLinkCreated error", { error: e.message, linkId });
  }
});

/**
 * Firestore-only unlink support: when a deviceLinks doc status changes to inactive,
 * remove mapping in RTDB and devices/{deviceID}.linkedUsers.
 */
export const onDeviceLinkUpdated = onDocumentUpdated("deviceLinks/{linkId}", async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();
  const linkId = event.params.linkId as string;
  if (!before || !after) return;

  const beforeStatus = (before.status || "active") as string;
  const afterStatus = (after.status || "active") as string;
  if (beforeStatus === afterStatus) return;

  const userId = after.userId as string;
  const deviceId = after.deviceId as string;
  if (!userId || !deviceId) return;

  try {
    if (afterStatus === "inactive") {
      // Remove from RTDB mapping
      await admin.database().ref(`users/${userId}/devices/${deviceId}`).set(null);
      // Remove from Firestore devices linkedUsers
      await admin.firestore().doc(`devices/${deviceId}`).set(
        {
          [`linkedUsers.${userId}`]: admin.firestore.FieldValue.delete(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      logger.info("Mirrored Firestore deviceLinks inactive to RTDB unlink", { linkId, deviceId, userId });
    }
  } catch (e: any) {
    logger.error("onDeviceLinkUpdated error", { error: e.message, linkId });
  }
});

/**
 * Get all intake records for a given patient.
 */
export const getPatientIntakeRecords = onCall(async (request) => {
  const patientId = request.data.patientId;
  if (!patientId) {
    throw new Error("Missing patientId");
  }

  const db = admin.firestore();
  const intakesSnapshot = await db
    .collection("intakeRecords")
    .where("patientId", "==", patientId)
    .orderBy("scheduledTime", "desc")
    .get();

  const intakes = intakesSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      // Convert Firestore Timestamps to ISO strings
      scheduledTime: data.scheduledTime.toDate().toISOString(),
      takenAt: data.takenAt ? data.takenAt.toDate().toISOString() : null,
    };
  });

  return { intakes };
});

/**
 * Get adherence data for a given patient, calculated from the last 24 hours.
 */
export const getPatientAdherence = onCall(async (request) => {
  const patientId = request.data.patientId;
  if (!patientId) {
    throw new Error("Missing patientId");
  }

  const db = admin.firestore();
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const intakesSnapshot = await db
    .collection("intakeRecords")
    .where("patientId", "==", patientId)
    .where("scheduledTime", ">=", twentyFourHoursAgo)
    .get();

  const intakes = intakesSnapshot.docs.map((doc) => doc.data());

  if (intakes.length === 0) {
    return { adherence: 100, doseSegments: [] };
  }

  const totalDoses = intakes.length;
  const takenDoses = intakes.filter((intake) => intake.status === "TAKEN").length;
  const missedDoses = intakes.filter((intake) => intake.status === "MISSED").length;
  const scheduledDoses = intakes.filter((intake) => intake.status === "SCHEDULED").length;

  const adherence = (takenDoses / totalDoses) * 100;

  const doseSegments = [];
  if (takenDoses > 0) {
    doseSegments.push({ percentage: (takenDoses / totalDoses) * 100, color: "#4CAF50" });
  }
  if (missedDoses > 0) {
    doseSegments.push({ percentage: (missedDoses / totalDoses) * 100, color: "#F44336" });
  }
  if (scheduledDoses > 0) {
    doseSegments.push({ percentage: (scheduledDoses / totalDoses) * 100, color: "#FFC107" });
  }

  return { adherence, doseSegments };
});
