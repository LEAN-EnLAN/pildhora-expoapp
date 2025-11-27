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
export { medicationAnalysis, patientMedicationQA } from "./ai";

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
const MISSED_DOSE_TASK_SECRET = process.env.MISSED_DOSE_TASK_SECRET || ""; // Optional: shared secret to verify Cloud Tasks caller

const tasksClient = new CloudTasksClient();

async function resolveOwnerUserId(deviceID: string): Promise<string | null> {
  // Prefer Firestore canonical device document
  try {
    const deviceDoc = await admin.firestore().doc(`devices/${deviceID}`).get();
    if (deviceDoc.exists) {
      const data = deviceDoc.data() || {};
      const primaryPatientId = data.primaryPatientId;
      if (typeof primaryPatientId === "string" && primaryPatientId.length > 0) {
        return primaryPatientId;
      }
    }
  } catch (e: any) {
    logger.warn("Failed to read Firestore device document when resolving ownerUserId", {
      deviceID,
      error: e.message,
    });
  }

  // Fallback: RTDB ownerUserId mapping
  try {
    const ownerSnap = await admin.database().ref(`devices/${deviceID}/ownerUserId`).get();
    const owner = ownerSnap.val();
    if (typeof owner === "string" && owner.length > 0) return owner;
  } catch (e: any) {
    logger.warn("ownerUserId not found on device node", { deviceID, error: e.message });
  }

  // As a safety net, we no longer scan the entire /users tree to avoid scaling issues.
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

  // Resolve project ID robustly for Cloud Tasks
  let project = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || "";
  if (!project && process.env.FIREBASE_CONFIG) {
    try {
      const cfg = JSON.parse(process.env.FIREBASE_CONFIG);
      project = cfg.projectId || "";
    } catch (e: any) {
      logger.error("Failed to parse FIREBASE_CONFIG when resolving projectId for Cloud Tasks", {
        error: e.message,
      });
    }
  }
  if (!project) {
    logger.error("Project ID could not be resolved; skipping Cloud Task creation", { deviceID, userID });
    return;
  }

  const parent = tasksClient.queuePath(project, TASKS_LOCATION, MISSED_DOSE_QUEUE);

  const payload = { deviceID, userID, scheduledAt: Date.now() };
  const task: any = {
    httpRequest: {
      httpMethod: "POST",
      url: CHECK_MISSED_DOSE_URL,
      headers: {
        "Content-Type": "application/json",
        ...(MISSED_DOSE_TASK_SECRET ? { "X-Missed-Dose-Secret": MISSED_DOSE_TASK_SECRET } : {}),
      },
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

  // Optional shared-secret validation to ensure this is invoked only by our Cloud Tasks.
  if (MISSED_DOSE_TASK_SECRET) {
    const provided = req.get("X-Missed-Dose-Secret") || "";
    if (provided !== MISSED_DOSE_TASK_SECRET) {
      logger.warn("checkMissedDose called with invalid or missing task secret");
      res.status(403).send("Forbidden");
      return;
    }
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
    const deviceRef = admin.firestore().doc(`devices/${deviceID}`);
    const deviceSnap = await deviceRef.get();
    const deviceData = deviceSnap.exists ? deviceSnap.data() || {} : {};

    // Remove from linkedUsers map
    const updates: Record<string, any> = {
      [`linkedUsers.${uid}`]: admin.firestore.FieldValue.delete(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // If this user was the primary patient, clear or reassign it
    if (deviceData.primaryPatientId === uid) {
      const linkedUsers = (deviceData.linkedUsers || {}) as Record<string, string>;
      const remainingPatientId =
        Object.entries(linkedUsers)
          .filter(([otherUid, role]) => otherUid !== uid && role === "patient")
          .map(([otherUid]) => otherUid)[0] || null;

      updates.primaryPatientId = remainingPatientId || null;
    }

    await deviceRef.set(updates, { merge: true });

    // Mark deviceLinks inactive
    await admin.firestore().doc(`deviceLinks/${deviceID}_${uid}`).set(
      {
        status: "inactive",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // If the unlinked user was the RTDB owner, clear or reassign ownerUserId
    try {
      const ownerSnap = await admin.database().ref(`devices/${deviceID}/ownerUserId`).get();
      const currentOwner = ownerSnap.val();
      if (currentOwner === uid) {
        let newOwner: string | null = null;
        const updatedSnap = await deviceRef.get();
        const updatedData = updatedSnap.exists ? updatedSnap.data() || {} : {};
        const linkedUsers = (updatedData.linkedUsers || {}) as Record<string, string>;
        newOwner =
          Object.entries(linkedUsers)
            .filter(([otherUid, role]) => role === "patient")
            .map(([otherUid]) => otherUid)[0] || null;

        if (newOwner) {
          await admin.database().ref(`devices/${deviceID}/ownerUserId`).set(newOwner);
        } else {
          await admin.database().ref(`devices/${deviceID}/ownerUserId`).set(null);
        }
      }
    } catch (e: any) {
      logger.warn("Failed to update RTDB ownerUserId on unlink", { deviceID, uid, error: e.message });
    }

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
  if (!event.data) return;
  
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
 * 
 * Task 9.3: Send notification to patient about new caregiver connection
 * Requirements: 5.4, 5.5, 5.6
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
    const userName = userDoc.get("name") || "Usuario";

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

    // Task 9.3: Send notification to patient about new caregiver connection
    // Requirements: 5.6
    if (role === "caregiver") {
      try {
        // Get the device document to find the patient
        const deviceDoc = await admin.firestore().doc(`devices/${deviceId}`).get();
        const deviceData = deviceDoc.data();
        const patientId = deviceData?.primaryPatientId;

        if (patientId) {
          // Get patient information
          const patientDoc = await admin.firestore().doc(`users/${patientId}`).get();
          const patientData = patientDoc.data();
          const patientName = patientData?.name || "Paciente";

          // Create a notification document in Firestore for the patient
          await admin.firestore().collection("notifications").add({
            userId: patientId,
            type: "caregiver_connected",
            title: "Nuevo Cuidador Conectado",
            message: `${userName} se ha conectado a tu dispositivo.`,
            data: {
              caregiverId: userId,
              caregiverName: userName,
              deviceId: deviceId,
              linkId: linkId,
            },
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // Try to send push notification if FCM tokens are available
          try {
            const tokensSnap = await admin.database().ref(`users/${patientId}/fcmTokens`).get();
            const tokensMap = tokensSnap.val() || {};
            const tokens = Object.keys(tokensMap);

            if (tokens.length > 0) {
              await admin.messaging().sendMulticast({
                tokens,
                notification: {
                  title: "Nuevo Cuidador Conectado",
                  body: `${userName} se ha conectado a tu dispositivo.`,
                },
                data: {
                  type: "caregiver_connected",
                  caregiverId: userId,
                  caregiverName: userName,
                  deviceId: deviceId,
                  linkId: linkId,
                },
              });
              logger.info("Sent push notification to patient about caregiver connection", {
                patientId,
                caregiverId: userId,
                deviceId,
              });
            } else {
              logger.info("No FCM tokens found for patient, notification stored in Firestore only", {
                patientId,
                caregiverId: userId,
                deviceId,
              });
            }
          } catch (pushError: any) {
            logger.warn("Failed to send push notification to patient", {
              error: pushError.message,
              patientId,
              caregiverId: userId,
              deviceId,
            });
          }

          logger.info("Notified patient about new caregiver connection", {
            patientId,
            patientName,
            caregiverId: userId,
            caregiverName: userName,
            deviceId,
          });
        } else {
          logger.warn("No patient found for device, skipping notification", {
            deviceId,
            caregiverId: userId,
          });
        }
      } catch (notificationError: any) {
        logger.error("Failed to send notification to patient about caregiver connection", {
          error: notificationError.message,
          deviceId,
          caregiverId: userId,
        });
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
  if (!event.data) return;
  
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
      const deviceRef = admin.firestore().doc(`devices/${deviceId}`);
      const deviceSnap = await deviceRef.get();
      const deviceData = deviceSnap.exists ? deviceSnap.data() || {} : {};

      // Remove from Firestore devices linkedUsers
      const updates: Record<string, any> = {
        [`linkedUsers.${userId}`]: admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Adjust primaryPatientId if needed
      if (deviceData.primaryPatientId === userId) {
        const linkedUsers = (deviceData.linkedUsers || {}) as Record<string, string>;
        const remainingPatientId =
          Object.entries(linkedUsers)
            .filter(([otherUid, role]) => otherUid !== userId && role === "patient")
            .map(([otherUid]) => otherUid)[0] || null;

        updates.primaryPatientId = remainingPatientId || null;
      }

      await deviceRef.set(updates, { merge: true });

      // Remove from RTDB mapping
      await admin.database().ref(`users/${userId}/devices/${deviceId}`).set(null);

      // Update RTDB ownerUserId if necessary
      try {
        const ownerSnap = await admin.database().ref(`devices/${deviceId}/ownerUserId`).get();
        const currentOwner = ownerSnap.val();
        if (currentOwner === userId) {
          let newOwner: string | null = null;
          const updatedSnap = await deviceRef.get();
          const updatedData = updatedSnap.exists ? updatedSnap.data() || {} : {};
          const linkedUsers = (updatedData.linkedUsers || {}) as Record<string, string>;
          newOwner =
            Object.entries(linkedUsers)
              .filter(([otherUid, role]) => role === "patient")
              .map(([otherUid]) => otherUid)[0] || null;

          if (newOwner) {
            await admin.database().ref(`devices/${deviceId}/ownerUserId`).set(newOwner);
          } else {
            await admin.database().ref(`devices/${deviceId}/ownerUserId`).set(null);
          }
        }
      } catch (e: any) {
        logger.warn("Failed to update RTDB ownerUserId on device link status change", {
          deviceId,
          userId,
          error: e.message,
        });
      }

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

export const onDispenseEventToIntake = onValueCreated({ ref: "/devices/{deviceID}/dispenseEvents/{eventID}" }, async (event) => {
  const deviceID = event.params.deviceID as string;
  const eventID = event.params.eventID as string;
  const data = event.data.val() || {};

  try {
    const userID = await resolveOwnerUserId(deviceID);
    if (!userID) {
      logger.error("onDispenseEventToIntake: unable to resolve owner userId, skipping intake record creation", {
        deviceID,
        eventID,
      });
      return;
    }
    const medId = data.medId as string | undefined;
    let medicationName = data.medicationName || "";
    let dosage = data.dosage || "";
    if ((!medicationName || !dosage) && medId) {
      const medDoc = await admin.firestore().doc(`medications/${medId}`).get();
      if (medDoc.exists) {
        const m = medDoc.data() || {};
        medicationName = m.name || medicationName || "";
        dosage = m.dosage || dosage || "";
      }
    }

    const scheduledMs = typeof data.scheduledTime === "number" ? data.scheduledTime : data.requestedAt || Date.now();
    const dispensedMs = typeof data.dispensedAt === "number" ? data.dispensedAt : Date.now();
    const ok = data.ok !== false;

    const docId = `${deviceID}_${eventID}`;
    await admin.firestore().doc(`intakeRecords/${docId}`).set(
      {
        deviceId: deviceID,
        patientId: userID,
        medicationId: medId || null,
        medicationName,
        dosage,
        scheduledTime: new Date(scheduledMs),
        status: ok ? "TAKEN" : "MISSED",
        takenAt: ok ? new Date(dispensedMs) : null,
        createdBy: "device",
        requestedBy: data.requestedBy || "",
        requestedAt: new Date(data.requestedAt || dispensedMs),
      },
      { merge: false }
    );

    logger.info("Created intake record from dispense event", { deviceID, eventID });
  } catch (e: any) {
    logger.error("onDispenseEventToIntake error", { error: e.message, deviceID, eventID });
  }
});

/**
 * Rate limiting enforcement for medicationEvents collection.
 * Monitors event creation and logs warnings when patients approach the rate limit.
 * Automatically blocks excessive event creation by deleting events that exceed the limit.
 */
export const onMedicationEventRateLimit = onDocumentCreated("medicationEvents/{eventId}", async (event) => {
  const eventId = event.params.eventId as string;
  const eventData = event.data?.data();
  
  if (!eventData) {
    logger.warn("onMedicationEventRateLimit: no event data", { eventId });
    return;
  }

  const patientId = eventData.patientId as string;
  if (!patientId) {
    logger.warn("onMedicationEventRateLimit: missing patientId", { eventId });
    return;
  }

  try {
    // Count events created by this patient in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentEventsSnapshot = await admin.firestore()
      .collection('medicationEvents')
      .where('patientId', '==', patientId)
      .where('timestamp', '>', oneHourAgo)
      .get();

    const eventCount = recentEventsSnapshot.size;

    // Log warning if approaching limit (80% threshold)
    if (eventCount >= 80 && eventCount < 100) {
      logger.warn("Patient approaching medication event rate limit", {
        patientId,
        eventCount,
        limit: 100,
        eventId
      });
    }

    // Enforce hard limit: delete events that exceed 100/hour
    if (eventCount > 100) {
      logger.error("Patient exceeded medication event rate limit", {
        patientId,
        eventCount,
        limit: 100,
        eventId,
        action: "deleting_event"
      });

      // Delete the event that exceeded the limit
      await admin.firestore().doc(`medicationEvents/${eventId}`).delete();

      // Optionally notify the patient or caregiver
      try {
        const userDoc = await admin.firestore().doc(`users/${patientId}`).get();
        const userData = userDoc.data();
        
        if (userData?.caregiverId) {
          // Log for caregiver monitoring
          logger.info("Rate limit exceeded - caregiver notification recommended", {
            patientId,
            caregiverId: userData.caregiverId,
            eventCount
          });
        }
      } catch (notifyError: any) {
        logger.warn("Failed to retrieve user data for rate limit notification", {
          error: notifyError.message,
          patientId
        });
      }
    }
  } catch (error: any) {
    logger.error("onMedicationEventRateLimit error", {
      error: error.message,
      eventId,
      patientId
    });
  }
});
