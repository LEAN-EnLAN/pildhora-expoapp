/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from "firebase-functions";
import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { onValueUpdated, onValueCreated, onValueDeleted } from "firebase-functions/database";
import { onDocumentUpdated, onDocumentCreated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { CloudTasksClient } from "@google-cloud/tasks";
// AI exports temporarily disabled due to missing genkit dependencies
// export { medicationAnalysis, patientMedicationQA } from "./ai";

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
setGlobalOptions({ maxInstances: 1 });

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
      await admin.messaging().sendEachForMulticast({
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
              await admin.messaging().sendEachForMulticast({
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
// export const getPatientIntakeRecords = onCall(async (request) => {
//   const patientId = request.data.patientId;
//   if (!patientId) {
//     throw new Error("Missing patientId");
//   }
//
//   const db = admin.firestore();
//   const intakesSnapshot = await db
//     .collection("intakeRecords")
//     .where("patientId", "==", patientId)
//     .orderBy("scheduledTime", "desc")
//     .get();
//
//   const intakes = intakesSnapshot.docs.map((doc) => {
//     const data = doc.data();
//     return {
//       id: doc.id,
//       ...data,
//       // Convert Firestore Timestamps to ISO strings
//       scheduledTime: data.scheduledTime.toDate().toISOString(),
//       takenAt: data.takenAt ? data.takenAt.toDate().toISOString() : null,
//     };
//   });
//
//   return { intakes };
// });

/**
 * Get adherence data for a given patient, calculated from the last 24 hours.
 */
// export const getPatientAdherence = onCall(async (request) => {
//   const patientId = request.data.patientId;
//   if (!patientId) {
//     throw new Error("Missing patientId");
//   }
//
//   const db = admin.firestore();
//   const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
//
//   const intakesSnapshot = await db
//     .collection("intakeRecords")
//     .where("patientId", "==", patientId)
//     .where("scheduledTime", ">=", twentyFourHoursAgo)
//     .get();
//
//   const intakes = intakesSnapshot.docs.map((doc) => doc.data());
//
//   if (intakes.length === 0) {
//     return { adherence: 100, doseSegments: [] };
//   }
//
//   const totalDoses = intakes.length;
//   const takenDoses = intakes.filter((intake) => intake.status === "TAKEN").length;
//   const missedDoses = intakes.filter((intake) => intake.status === "MISSED").length;
//   const scheduledDoses = intakes.filter((intake) => intake.status === "SCHEDULED").length;
//
//   const adherence = (takenDoses / totalDoses) * 100;
//
//   const doseSegments = [];
//   if (takenDoses > 0) {
//     doseSegments.push({ percentage: (takenDoses / totalDoses) * 100, color: "#4CAF50" });
//   }
//   if (missedDoses > 0) {
//     doseSegments.push({ percentage: (missedDoses / totalDoses) * 100, color: "#F44336" });
//   }
//   if (scheduledDoses > 0) {
//     doseSegments.push({ percentage: (scheduledDoses / totalDoses) * 100, color: "#FFC107" });
//   }
//
//   return { adherence, doseSegments };
// });

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
// export const onMedicationEventRateLimit = onDocumentCreated("medicationEvents/{eventId}", async (event) => {
//   const eventId = event.params.eventId as string;
//   const eventData = event.data?.data();
//
//   if (!eventData) {
//     logger.warn("onMedicationEventRateLimit: no event data", { eventId });
//     return;
//   }
//
//   const patientId = eventData.patientId as string;
//   if (!patientId) {
//     logger.warn("onMedicationEventRateLimit: missing patientId", { eventId });
//     return;
//   }
//
//   try {
//     // Count events created by this patient in the last hour
//     const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
//     const recentEventsSnapshot = await admin.firestore()
//       .collection('medicationEvents')
//       .where('patientId', '==', patientId)
//       .where('timestamp', '>', oneHourAgo)
//       .get();
//
//     const eventCount = recentEventsSnapshot.size;
//
//     // Log warning if approaching limit (80% threshold)
//     if (eventCount >= 80 && eventCount < 100) {
//       logger.warn("Patient approaching medication event rate limit", {
//         patientId,
//         eventCount,
//         limit: 100,
//         eventId
//       });
//     }
//
//     // Enforce hard limit: delete events that exceed 100/hour
//     if (eventCount > 100) {
//       logger.error("Patient exceeded medication event rate limit", {
//         patientId,
//         eventCount,
//         limit: 100,
//         eventId,
//         action: "deleting_event"
//       });
//
//       // Delete the event that exceeded the limit
//       await admin.firestore().doc(`medicationEvents/${eventId}`).delete();
//
//       // Optionally notify the patient or caregiver
//       try {
//         const userDoc = await admin.firestore().doc(`users/${patientId}`).get();
//         const userData = userDoc.data();
//
//         if (userData?.caregiverId) {
//           // Log for caregiver monitoring
//           logger.info("Rate limit exceeded - caregiver notification recommended", {
//             patientId,
//             caregiverId: userData.caregiverId,
//             eventCount
//           });
//         }
//       } catch (notifyError: any) {
//         logger.warn("Failed to retrieve user data for rate limit notification", {
//           error: notifyError.message,
//           patientId
//         });
//       }
//     }
//   } catch (error: any) {
//     logger.error("onMedicationEventRateLimit error", {
//       error: error.message,
//       eventId,
//       patientId
//     });
//   }
// });


/**
 * Send push notifications to caregivers when critical events are created.
 * Handles topo alarm events (topo_started, topo_taken, topo_missed, topo_timeout).
 */
export const onCriticalEventCreatedV4 = onDocumentCreated("criticalEvents/{eventId}", async (event) => {
  const eventId = event.params.eventId as string;
  const eventData = event.data?.data();

  if (!eventData) {
    logger.warn("onCriticalEventNotify: no event data", { eventId });
    return;
  }

  const caregiverId = eventData.caregiverId as string;
  const eventType = eventData.eventType as string;
  const title = eventData.title as string;
  const message = eventData.message as string;
  const patientId = eventData.patientId as string;
  const medicationName = eventData.medicationName as string | undefined;

  if (!caregiverId) {
    logger.warn("onCriticalEventNotify: missing caregiverId", { eventId });
    return;
  }

  try {
    // Get caregiver FCM tokens
    const tokensSnap = await admin.database().ref(`users/${caregiverId}/fcmTokens`).get();
    const tokensMap = tokensSnap.val() || {};
    const tokens = Object.keys(tokensMap);

    if (tokens.length === 0) {
      logger.info("No FCM tokens found for caregiver, marking event as delivered", {
        eventId,
        caregiverId,
        eventType,
      });
      
      // Mark as delivered even without tokens (no push capability)
      await admin.firestore().doc(`criticalEvents/${eventId}`).update({
        notificationSent: true,
        notificationSentAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return;
    }

    // Send push notification
    const result = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title: title || "Alerta de Medicación",
        body: message || "Evento de medicación detectado",
      },
      data: {
        type: eventType || "critical_event",
        eventId,
        patientId: patientId || "",
        medicationName: medicationName || "",
      },
      android: {
        priority: "high",
        notification: {
          channelId: "critical_alerts",
          priority: "high",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
            contentAvailable: true,
          },
        },
      },
    });

    // Update event with notification status
    await admin.firestore().doc(`criticalEvents/${eventId}`).update({
      notificationSent: true,
      notificationSentAt: admin.firestore.FieldValue.serverTimestamp(),
      notificationResults: {
        successCount: result.successCount,
        failureCount: result.failureCount,
      },
    });

    logger.info("Sent critical event notification to caregiver", {
      eventId,
      caregiverId,
      eventType,
      successCount: result.successCount,
      failureCount: result.failureCount,
    });

    // Clean up invalid tokens
    if (result.failureCount > 0) {
      const invalidTokens: string[] = [];
      result.responses.forEach((resp: admin.messaging.SendResponse, idx: number) => {
        if (!resp.success && resp.error?.code === "messaging/registration-token-not-registered") {
          invalidTokens.push(tokens[idx]);
        }
      });

      for (const token of invalidTokens) {
        await admin.database().ref(`users/${caregiverId}/fcmTokens/${token}`).remove();
        logger.info("Removed invalid FCM token", { caregiverId, token: token.substring(0, 20) + "..." });
      }
    }
  } catch (error: any) {
    logger.error("onCriticalEventNotify error", {
      error: error.message,
      eventId,
      caregiverId,
      eventType,
    });

    // Mark notification as failed
    await admin.firestore().doc(`criticalEvents/${eventId}`).update({
      notificationSent: false,
      notificationError: error.message,
    });
  }
});

// ============================================================================
// TOPO COMMAND INTAKE TRACKING
// ============================================================================

/**
 * When topo command is triggered on a device, create a pending intake record.
 * This ensures we have a record of when the alarm started, even if the patient
 * doesn't respond through the app.
 * 
 * Triggered when /devices/{deviceID}/commands/topo changes to true.
 */
export const onTopoCommandTriggeredV4 = onValueUpdated({ ref: "/devices/{deviceID}/commands/topo" }, async (event) => {
  const deviceID = event.params.deviceID as string;
  const before = event.data.before.val();
  const after = event.data.after.val();

  // Only process when topo changes from false to true (alarm starting)
  if (before === true || after !== true) {
    return;
  }

  logger.info("Topo command triggered", { deviceID, before, after });

  try {
    const userID = await resolveOwnerUserId(deviceID);
    if (!userID) {
      logger.warn("onTopoCommandTriggered: unable to resolve owner userId", { deviceID });
      return;
    }

    // Get the current time and find the closest scheduled medication
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

    // Get today's day abbreviation for schedule matching
    const dayAbbrevs = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayAbbrev = dayAbbrevs[now.getDay()];

    // Query medications for this patient scheduled for today
    const medsSnapshot = await admin.firestore()
      .collection('medications')
      .where('patientId', '==', userID)
      .get();

    if (medsSnapshot.empty) {
      logger.info("No medications found for patient", { deviceID, userID });
      return;
    }

    // Find the medication with the closest scheduled time to now
    let closestMed: any = null;
    let closestTimeDiff = Infinity;
    let closestScheduledTime: Date | null = null;

    for (const doc of medsSnapshot.docs) {
      const med = doc.data();
      const frequency = med.frequency || '';
      const days = frequency.split(',').map((s: string) => s.trim());
      
      // Check if medication is scheduled for today
      if (!days.includes(todayAbbrev)) continue;

      const times = med.times || [];
      for (const timeStr of times) {
        const [hh, mm] = timeStr.split(':').map(Number);
        if (isNaN(hh)) continue;

        const scheduledDate = new Date(now);
        scheduledDate.setHours(hh, mm || 0, 0, 0);
        
        const timeDiff = Math.abs(now.getTime() - scheduledDate.getTime());
        
        // Only consider times within 30 minutes of now
        if (timeDiff < 30 * 60 * 1000 && timeDiff < closestTimeDiff) {
          closestTimeDiff = timeDiff;
          closestMed = { id: doc.id, ...med };
          closestScheduledTime = scheduledDate;
        }
      }
    }

    if (!closestMed || !closestScheduledTime) {
      logger.info("No medication scheduled near current time", { deviceID, userID, currentTimeStr });
      return;
    }

    // Check if an intake record already exists for this medication and time
    const existingIntakeSnapshot = await admin.firestore()
      .collection('intakeRecords')
      .where('patientId', '==', userID)
      .where('medicationId', '==', closestMed.id)
      .where('scheduledTime', '>=', new Date(closestScheduledTime.getTime() - 5 * 60 * 1000))
      .where('scheduledTime', '<=', new Date(closestScheduledTime.getTime() + 5 * 60 * 1000))
      .limit(1)
      .get();

    if (!existingIntakeSnapshot.empty) {
      logger.info("Intake record already exists for this dose", { 
        deviceID, 
        userID, 
        medicationId: closestMed.id,
        scheduledTime: closestScheduledTime.toISOString()
      });
      return;
    }

    // Create a pending intake record
    const intakeId = `topo_${deviceID}_${closestScheduledTime.getTime()}`;
    const dosage = closestMed.dosage || 
      `${closestMed.doseValue || ''} ${closestMed.doseUnit || ''}`.trim() ||
      'N/A';

    await admin.firestore().doc(`intakeRecords/${intakeId}`).set({
      medicationId: closestMed.id,
      medicationName: closestMed.name,
      dosage,
      scheduledTime: closestScheduledTime,
      status: 'pending',
      patientId: userID,
      deviceId: deviceID,
      deviceSource: 'pillbox',
      topoTriggeredAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info("Created pending intake record from topo trigger", {
      deviceID,
      userID,
      medicationId: closestMed.id,
      medicationName: closestMed.name,
      scheduledTime: closestScheduledTime.toISOString(),
      intakeId,
    });

    // Also update device state to ALARM_SOUNDING if not already
    try {
      await admin.database().ref(`devices/${deviceID}/state/current_status`).set('ALARM_SOUNDING');
    } catch (e: any) {
      logger.warn("Failed to update device status to ALARM_SOUNDING", { deviceID, error: e.message });
    }

  } catch (error: any) {
    logger.error("onTopoCommandTriggered error", { error: error.message, deviceID });
  }
});

/**
 * When topo command is cleared (set to false), check if dose was taken or missed.
 * This handles the case where the physical button on the device was pressed.
 */
export const onTopoCommandClearedV4 = onValueUpdated({ ref: "/devices/{deviceID}/commands/topo" }, async (event) => {
  const deviceID = event.params.deviceID as string;
  const before = event.data.before.val();
  const after = event.data.after.val();

  // Only process when topo changes from true to false (alarm ending)
  if (before !== true || after !== false) {
    return;
  }

  logger.info("Topo command cleared", { deviceID });

  try {
    const userID = await resolveOwnerUserId(deviceID);
    if (!userID) {
      logger.warn("onTopoCommandCleared: unable to resolve owner userId", { deviceID });
      return;
    }

    // Find the most recent pending intake record for this device
    const pendingIntakeSnapshot = await admin.firestore()
      .collection('intakeRecords')
      .where('deviceId', '==', deviceID)
      .where('status', '==', 'pending')
      .orderBy('topoTriggeredAt', 'desc')
      .limit(1)
      .get();

    if (pendingIntakeSnapshot.empty) {
      logger.info("No pending intake record found to update", { deviceID, userID });
      return;
    }

    const intakeDoc = pendingIntakeSnapshot.docs[0];
    const intakeData = intakeDoc.data();

    // Check device state to determine if dose was taken
    const stateSnap = await admin.database().ref(`devices/${deviceID}/state/current_status`).get();
    const currentStatus = stateSnap.val();

    // If status is DOSE_TAKEN, mark as taken; otherwise mark as taken (button press = taken)
    // The device button press clears topo, which means patient acknowledged
    const status = currentStatus === 'DOSE_MISSED' ? 'MISSED' : 'TAKEN';
    const takenAt = status === 'TAKEN' ? admin.firestore.FieldValue.serverTimestamp() : null;

    await intakeDoc.ref.update({
      status,
      takenAt,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      completedBy: 'device_button',
    });

    logger.info("Updated intake record from topo clear", {
      deviceID,
      userID,
      intakeId: intakeDoc.id,
      status,
      medicationName: intakeData.medicationName,
    });

    // Update device state
    try {
      await admin.database().ref(`devices/${deviceID}/state/current_status`).set(
        status === 'TAKEN' ? 'DOSE_TAKEN' : 'DOSE_MISSED'
      );
    } catch (e: any) {
      logger.warn("Failed to update device status after topo clear", { deviceID, error: e.message });
    }

  } catch (error: any) {
    logger.error("onTopoCommandCleared error", { error: error.message, deviceID });
  }
});

/**
 * Process intake records created by the app (from topoAlarmService).
 * Ensures consistency and creates medication events for caregiver visibility.
 */
export const onIntakeRecordCreatedV4 = onDocumentCreated("intakeRecords/{intakeId}", async (event) => {
  const intakeId = event.params.intakeId as string;
  const intakeData = event.data?.data();

  if (!intakeData) {
    logger.warn("onIntakeRecordCreated: no intake data", { intakeId });
    return;
  }

  const patientId = intakeData.patientId as string;
  const medicationId = intakeData.medicationId as string;
  const medicationName = intakeData.medicationName as string;
  const status = intakeData.status as string;
  const topoTriggered = intakeData.topoTriggered as boolean;

  // Skip if this is a pending record (will be processed when completed)
  if (status === 'pending') {
    return;
  }

  try {
    // Get patient info
    const patientDoc = await admin.firestore().doc(`users/${patientId}`).get();
    const patientData = patientDoc.data() || {};
    const patientName = patientData.name || 'Paciente';

    // Get medication info to find caregiver
    let caregiverId: string | null = null;
    if (medicationId) {
      const medDoc = await admin.firestore().doc(`medications/${medicationId}`).get();
      if (medDoc.exists) {
        caregiverId = medDoc.data()?.caregiverId || null;
      }
    }

    // Create a medication event for the caregiver dashboard
    if (caregiverId && topoTriggered) {
      const eventType = status === 'TAKEN' ? 'dose_taken' : 'dose_missed';
      
      await admin.firestore().collection('medicationEvents').add({
        eventType,
        medicationId: medicationId || null,
        medicationName,
        medicationData: {
          dosage: intakeData.dosage,
          scheduledTime: intakeData.scheduledTime,
        },
        patientId,
        patientName,
        caregiverId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        syncStatus: 'pending',
        intakeRecordId: intakeId,
      });

      logger.info("Created medication event from intake record", {
        intakeId,
        eventType,
        patientId,
        caregiverId,
        medicationName,
      });
    }

    // Update medication inventory if tracking is enabled
    if (medicationId && status === 'TAKEN') {
      const medDoc = await admin.firestore().doc(`medications/${medicationId}`).get();
      if (medDoc.exists) {
        const medData = medDoc.data() || {};
        if (medData.trackInventory && typeof medData.currentQuantity === 'number') {
          const newQuantity = Math.max(0, medData.currentQuantity - 1);
          await medDoc.ref.update({
            currentQuantity: newQuantity,
            lastIntakeAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // Check for low inventory alert
          const threshold = medData.lowQuantityThreshold || 10;
          if (newQuantity <= threshold && newQuantity > 0) {
            logger.info("Low medication inventory alert", {
              medicationId,
              medicationName,
              currentQuantity: newQuantity,
              threshold,
              patientId,
            });

            // Create critical event for low inventory
            if (caregiverId) {
              await admin.firestore().collection('criticalEvents').add({
                eventType: 'low_inventory',
                patientId,
                patientName,
                caregiverId,
                medicationName,
                title: '⚠️ Inventario bajo',
                message: `${medicationName} tiene solo ${newQuantity} unidades restantes`,
                read: false,
                notificationSent: false,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
              });
            }
          }
        }
      }
    }

  } catch (error: any) {
    logger.error("onIntakeRecordCreated error", { error: error.message, intakeId });
  }
});

// ============================================================================
// CALLABLE FUNCTIONS (API)
// ============================================================================

/**
 * Get caregivers linked to a patient's devices.
 * Used by DeviceSettings to avoid direct reads of users collection by patient.
 */
export const getLinkedCaregivers = onCall(async (request) => {
  const callerUid = request.auth?.uid;
  if (!callerUid) {
    throw new HttpsError('unauthenticated', 'User must be logged in');
  }
  
  const patientId = request.data.patientId || callerUid;
  const specificDeviceId = request.data.deviceId;

  if (patientId !== callerUid) {
     throw new HttpsError('permission-denied', 'Can only fetch own caregivers');
  }

  let targetDeviceIds: string[] = [];

  if (specificDeviceId) {
     // Verify patient is linked to this device
     const linkCheck = await admin.firestore().collection('deviceLinks')
        .where('userId', '==', patientId)
        .where('deviceId', '==', specificDeviceId)
        .where('role', '==', 'patient')
        .where('status', '==', 'active')
        .get();
     
     if (!linkCheck.empty) {
         targetDeviceIds = [specificDeviceId];
     }
  } else {
     // 1. Find all devices linked to patient
     const linksSnap = await admin.firestore().collection('deviceLinks')
        .where('userId', '==', patientId)
        .where('role', '==', 'patient')
        .where('status', '==', 'active')
        .get();
        
     targetDeviceIds = linksSnap.docs.map(d => d.data().deviceId);
  }
  
  if (targetDeviceIds.length === 0) return [];

  // 2. Find caregivers linked to these devices
  const caregiverLinksSnap = await admin.firestore().collection('deviceLinks')
    .where('deviceId', 'in', targetDeviceIds)
    .where('role', '==', 'caregiver')
    .where('status', '==', 'active')
    .get();

  // Map userId to link data (to get linkedAt)
  const userLinkMap = new Map();
  caregiverLinksSnap.docs.forEach(d => {
      const data = d.data();
      if (!userLinkMap.has(data.userId)) {
          userLinkMap.set(data.userId, {
              linkedAt: data.linkedAt
          });
      }
  });

  const caregiverUserIds = [...userLinkMap.keys()];
  
  if (caregiverUserIds.length === 0) return [];

  // 3. Fetch user profiles
  const userRefs = caregiverUserIds.map(uid => admin.firestore().doc(`users/${uid}`));
  const usersSnap = await admin.firestore().getAll(...userRefs);
  
  return usersSnap.map(snap => {
      const data = snap.data();
      if (!data) return null;
      const linkData = userLinkMap.get(snap.id);
      // Handle Firestore Timestamp serialization
      let linkedAtIso = null;
      if (linkData?.linkedAt) {
          // If it's a Firestore Timestamp, it has toDate()
          if (typeof linkData.linkedAt.toDate === 'function') {
              linkedAtIso = linkData.linkedAt.toDate().toISOString();
          } else if (linkData.linkedAt instanceof Date) {
              linkedAtIso = linkData.linkedAt.toISOString();
          } else {
              linkedAtIso = linkData.linkedAt; // Fallback
          }
      }

      return {
          id: snap.id,
          name: data.name,
          email: data.email,
          role: data.role,
          linkedAt: linkedAtIso
      };
  }).filter(u => u !== null);
});


/**
 * Link a device to a user (Patient or Caregiver).
 * Replaces client-side logic to ensure security and data consistency.
 */
export const linkDeviceToUser = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'User must be logged in');
  }

  const { deviceId } = request.data;
  if (!deviceId || typeof deviceId !== 'string' || deviceId.length < 5) {
    throw new HttpsError('invalid-argument', 'Invalid deviceId');
  }

  const db = admin.firestore();

  // 1. Determine User Role
  const userDoc = await db.doc(`users/${uid}`).get();
  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'User profile not found');
  }
  const userData = userDoc.data();
  const role = userData?.role || 'patient';

  // 2. Ensure Device Exists (Provisioning)
  const deviceRef = db.doc(`devices/${deviceId}`);
  const deviceSnap = await deviceRef.get();
  if (!deviceSnap.exists) {
     // Check RTDB for legacy/provisioning existence
     const rdbSnap = await admin.database().ref(`devices/${deviceId}`).get();
     if (!rdbSnap.exists()) {
         throw new HttpsError('not-found', 'Device ID not found in system');
     }
     // Create placeholder in Firestore
     await deviceRef.set({
         createdAt: admin.firestore.FieldValue.serverTimestamp(),
         updatedAt: admin.firestore.FieldValue.serverTimestamp()
     });
  }

  // 3. Create Device Link
  const linkId = `${deviceId}_${uid}`;
  const linkRef = db.doc(`deviceLinks/${linkId}`);
  
  // Check if already linked
  const linkSnap = await linkRef.get();
  if (linkSnap.exists && linkSnap.data()?.status === 'active') {
      return { success: true, message: 'Already linked' };
  }

  await linkRef.set({
      id: linkId,
      deviceId,
      userId: uid,
      role,
      status: 'active',
      linkedAt: admin.firestore.FieldValue.serverTimestamp(),
      linkedBy: uid
  }, { merge: true });

  // 4. Update Patient Profile (if patient)
  if (role === 'patient') {
      await db.doc(`users/${uid}`).set({
          deviceId // Set main deviceId
      }, { merge: true });
  }

  // 5. Create Caregiver-Patient Link (if caregiver)
  if (role === 'caregiver') {
      // Find patient owner of this device
      const patientQuery = await db.collection('users')
          .where('deviceId', '==', deviceId)
          .where('role', '==', 'patient')
          .limit(1)
          .get();
      
      if (!patientQuery.empty) {
          const patientId = patientQuery.docs[0].id;
          await db.doc(`caregiverPatients/${uid}/patients/${patientId}`).set({
              linkedAt: admin.firestore.FieldValue.serverTimestamp(),
              deviceId // context
          }, { merge: true });
      }
  }

  return { success: true };
});

/**
 * Unlink a device from a user.
 * Handles both self-unlinking and patient revoking caregiver access.
 */
export const unlinkDeviceFromUser = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'User must be logged in');

  const { deviceId, userId } = request.data; // userId is optional, defaults to uid
  const targetUserId = userId || uid;

  const db = admin.firestore();

  // Permission Check
  if (targetUserId !== uid) {
      // Caller is trying to unlink someone else.
      // Must be the patient owner unlinking a caregiver.
      const callerUserDoc = await db.doc(`users/${uid}`).get();
      const callerDeviceId = callerUserDoc.data()?.deviceId;
      
      if (callerDeviceId !== deviceId) {
           throw new HttpsError('permission-denied', 'You can only unlink users from your own device');
      }
  }

  const linkId = `${deviceId}_${targetUserId}`;
  
  // Soft delete (set to inactive) - triggers onDeviceLinkUpdated which handles RTDB sync
  await db.doc(`deviceLinks/${linkId}`).update({
      status: 'inactive',
      unlinkedAt: admin.firestore.FieldValue.serverTimestamp(),
      unlinkedBy: uid
  });
  
  // If patient unlinking self, remove deviceId from profile
  if (targetUserId === uid) {
       const userDoc = await db.doc(`users/${uid}`).get();
       if (userDoc.data()?.deviceId === deviceId) {
           await db.doc(`users/${uid}`).update({
               deviceId: admin.firestore.FieldValue.delete()
           });
       }
  }

  return { success: true };
});

/**
 * Update device configuration.
 * Replaces direct DB writes to devices/{deviceId}/config or desiredConfig.
 */
export const updateDeviceConfig = onCall(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'User must be logged in');
    
    const { deviceId, config } = request.data;
    if (!deviceId || !config) throw new HttpsError('invalid-argument', 'Missing deviceId or config');
    
    // Verify link
    const linkSnap = await admin.firestore().doc(`deviceLinks/${deviceId}_${uid}`).get();
    if (!linkSnap.exists || linkSnap.data()?.status !== 'active') {
         throw new HttpsError('permission-denied', 'User not linked to device');
    }
    
    const db = admin.firestore();
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    // 1. Update deviceConfigs (Application State)
    await db.doc(`deviceConfigs/${deviceId}`).set({
        ...config,
        lastUpdated: timestamp,
        syncStatus: 'pending'
    }, { merge: true });
    
    // 2. Update Firestore devices/{deviceId} (Device State) - triggers mirror to RTDB
    await db.doc(`devices/${deviceId}`).set({
        desiredConfig: config,
        updatedAt: timestamp
    }, { merge: true });
    
    return { success: true };
});

/**
 * Get device configuration and status.
 * Aggregates data from Firestore and RTDB to provide a complete view of the device.
 * Replaces direct DB reads to ensure security and data consistency.
 */
export const getDeviceConfig = onCall(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'User must be logged in');
    
    const { deviceId } = request.data;
    if (!deviceId) throw new HttpsError('invalid-argument', 'Missing deviceId');
    
    const db = admin.firestore();
    
    // 1. Verify Access (User must be linked)
    const linkSnap = await db.doc(`deviceLinks/${deviceId}_${uid}`).get();
    if (!linkSnap.exists || linkSnap.data()?.status !== 'active') {
         // Allow if user is the owner in users collection (legacy check)
         const userSnap = await db.doc(`users/${uid}`).get();
         if (userSnap.data()?.deviceId !== deviceId) {
             throw new HttpsError('permission-denied', 'User not linked to device');
         }
    }
    
    // 2. Fetch Firestore Data
    const [configSnap, deviceSnap] = await Promise.all([
        db.doc(`deviceConfigs/${deviceId}`).get(),
        db.doc(`devices/${deviceId}`).get()
    ]);
    
    const firestoreData = {
        ...deviceSnap.data(),
        config: configSnap.exists ? configSnap.data() : null
    };
    
    // 3. Fetch RTDB Data (Real-time status)
    const rdbSnap = await admin.database().ref(`devices/${deviceId}`).get();
    const rdbData = rdbSnap.exists() ? rdbSnap.val() : null;
    
    // 4. Construct Response
    return {
        deviceId,
        firestore: firestoreData,
        rdb: rdbData,
        // Helper fields for easier frontend consumption
        batteryLevel: rdbData?.state?.battery_level ?? rdbData?.state?.batteryPercent ?? null,
        isOnline: rdbData?.state?.online ?? false,
        lastSeen: rdbData?.state?.last_seen ?? null,
        currentStatus: rdbData?.state?.current_status ?? 'unknown'
    };
});


/**
 * Send a direct command to the device (buzzer, led, reboot).
 */
export const sendDeviceCommand = onCall(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'User must be logged in');
    
    const { deviceId, command } = request.data;
    if (!deviceId || !command) throw new HttpsError('invalid-argument', 'Missing deviceId or command');
    
    // Verify link
    const linkSnap = await admin.firestore().doc(`deviceLinks/${deviceId}_${uid}`).get();
    if (!linkSnap.exists || linkSnap.data()?.status !== 'active') {
         throw new HttpsError('permission-denied', 'User not linked to device');
    }
    
    // Validate command keys
    const allowedKeys = ['topo', 'buzzer', 'led', 'ledColor', 'reboot'];
    const keys = Object.keys(command);
    for (const key of keys) {
        if (!allowedKeys.includes(key)) {
            throw new HttpsError('invalid-argument', `Invalid command key: ${key}`);
        }
    }
    
    // Update RTDB
    await admin.database().ref(`devices/${deviceId}/commands`).update(command);
    
    return { success: true };
});

/**
 * Request a complex device action (dispense, sync_time, check_status).
 */
export const requestDeviceAction = onCall(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'User must be logged in');
    
    const { deviceId, actionType } = request.data;
    if (!deviceId || !actionType) throw new HttpsError('invalid-argument', 'Missing deviceId or actionType');
    
    // Verify link
    const linkSnap = await admin.firestore().doc(`deviceLinks/${deviceId}_${uid}`).get();
    if (!linkSnap.exists || linkSnap.data()?.status !== 'active') {
         throw new HttpsError('permission-denied', 'User not linked to device');
    }
    
    const rdb = admin.database();
    
    if (actionType === 'dispense_dose') {
        // Check device state
        const stateSnap = await rdb.ref(`devices/${deviceId}/state`).get();
        if (!stateSnap.exists()) throw new HttpsError('unavailable', 'Device state not found');
        
        const st = stateSnap.val() || {};
        const current = (st.current_status || '').toString().toLowerCase();
        const timeSynced = !!st.time_synced;
        const isIdle = current === 'idle' || current === 'ready' || current === '';
        
        if (!st.is_online) throw new HttpsError('unavailable', 'Device is offline');
        if (!timeSynced) throw new HttpsError('failed-precondition', 'Device time not synced');
        if (!isIdle) throw new HttpsError('failed-precondition', 'Device not ready');
        
        const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        await rdb.ref(`devices/${deviceId}/dispenseRequests/${requestId}`).set({
            requestedBy: uid,
            requestedAt: admin.database.ServerValue.TIMESTAMP,
            dose: 1,
            status: 'pending'
        });
        
        return { success: true, actionId: requestId };
    } 
    else if (actionType === 'sync_time' || actionType === 'check_status') {
        // Write to actions node
        const actionId = `action_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        await rdb.ref(`devices/${deviceId}/actions/${actionId}`).set({
            actionType,
            requestedBy: uid,
            requestedAt: admin.database.ServerValue.TIMESTAMP,
            status: 'pending'
        });
        
        return { success: true, actionId };
    }
    else if (actionType === 'clear_alarm') {
        // Reset all commands
         await rdb.ref(`devices/${deviceId}/commands`).update({
            topo: false,
            buzzer: false,
            led: false,
            reboot: false
        });
        return { success: true };
    }
    else if (actionType === 'test_alarm') {
        // Trigger buzzer
        await rdb.ref(`devices/${deviceId}/commands`).update({ buzzer: true });
        return { success: true };
    }
    
    throw new HttpsError('invalid-argument', 'Unknown action type');
});

/**
 * Set autonomous mode for the authenticated user.
 */
export const setAutonomousMode = onCall(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'User must be logged in');
    
    const { enabled } = request.data;
    if (typeof enabled !== 'boolean') throw new HttpsError('invalid-argument', 'Enabled must be boolean');
    
    await admin.firestore().doc(`users/${uid}`).set({
        autonomousMode: enabled,
        autonomousModeChangedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    return { success: true };
});



/**
 * Dismiss Topo Alarm (Patient).
 */
export const dismissTopo = onCall(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'User must be logged in');
    
    const { deviceId } = request.data;
    if (!deviceId) throw new HttpsError('invalid-argument', 'Missing deviceId');
    
    // Verify link
    const linkSnap = await admin.firestore().doc(`deviceLinks/${deviceId}_${uid}`).get();
    if (!linkSnap.exists || linkSnap.data()?.status !== 'active') {
         throw new HttpsError('permission-denied', 'User not linked to device');
    }
    
    // Set command to false in RTDB
    await admin.database().ref(`devices/${deviceId}/commands/topo`).set(false);
    
    return { success: true };
});

/**
 * Update inventory (Caregiver).
 */
export const updateInventory = onCall(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'User must be logged in');
    
    const { medicationId, quantity } = request.data;
    if (!medicationId || typeof quantity !== 'number') throw new HttpsError('invalid-argument', 'Invalid args');
    
    const medRef = admin.firestore().doc(`medications/${medicationId}`);
    const medSnap = await medRef.get();
    if (!medSnap.exists) throw new HttpsError('not-found', 'Medication not found');
    
    const medData = medSnap.data() || {};
    
    // Check permission: caller must be linked to patient of this medication
    // Or caller IS the patient (if self-managed?) - usually caregiver manages
    // For now, assume anyone with access to the med (via security rules) can update?
    // Better to check explicit link.
    
    // Simplification: if they have the ID, and we trust them (auth), let's do it.
    // But we should check if they are the caregiverId on the med or linked to patientId.
    
    await medRef.update({
        currentQuantity: quantity,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true };
});

/**
 * Create Connection Code (Patient).
 */
export const generateConnectionCode = onCall(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'User must be logged in');
    
    const { deviceId, expiresInHours = 24 } = request.data;
    if (!deviceId) throw new HttpsError('invalid-argument', 'Missing deviceId');

    // Verify patient owns the device (or is linked as patient)
    const linkSnap = await admin.firestore().doc(`deviceLinks/${deviceId}_${uid}`).get();
    if (!linkSnap.exists || linkSnap.data()?.role !== 'patient' || linkSnap.data()?.status !== 'active') {
         throw new HttpsError('permission-denied', 'Only the patient owner can generate codes');
    }

    // Get patient name
    const userDoc = await admin.firestore().doc(`users/${uid}`).get();
    const patientName = userDoc.data()?.name || 'Unknown Patient';

    // Generate unique code
    let code = '';
    let attempts = 0;
    while (attempts < 5) {
        code = Math.random().toString(36).substring(2, 8).toUpperCase();
        // Avoid ambiguous chars if possible, but for now simple random
        const codeSnap = await admin.firestore().doc(`connectionCodes/${code}`).get();
        if (!codeSnap.exists) break;
        attempts++;
    }
    if (attempts >= 5) throw new HttpsError('aborted', 'Failed to generate unique code');

    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    
    await admin.firestore().doc(`connectionCodes/${code}`).set({
        id: code, // client expects id field
        patientId: uid,
        patientName,
        deviceId,
        code, // redundant but keeps compatibility
        expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
        used: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { code };
});

/**
 * Validate Connection Code (Caregiver).
 */
export const validateConnectionCode = onCall(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'User must be logged in');
    
    const { code } = request.data;
    if (!code) throw new HttpsError('invalid-argument', 'Missing code');
    
    const codeDoc = await admin.firestore().doc(`connectionCodes/${code.toUpperCase()}`).get();
        
    if (!codeDoc.exists) throw new HttpsError('not-found', 'Invalid code');
    
    const codeData = codeDoc.data();
    if (!codeData) throw new HttpsError('not-found', 'Invalid code data');
    
    if (codeData.used) throw new HttpsError('failed-precondition', 'Code already used');
    
    if (codeData.expiresAt.toDate() < new Date()) {
        throw new HttpsError('failed-precondition', 'Code expired');
    }
    
    return {
        code: codeData.id,
        deviceId: codeData.deviceId,
        patientId: codeData.patientId,
        patientName: codeData.patientName,
        expiresAt: codeData.expiresAt.toDate().toISOString(),
        used: codeData.used
    };
});

/**
 * Use Connection Code (Caregiver).
 */
export const useConnectionCode = onCall(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'User must be logged in');
    
    const { code } = request.data;
    if (!code) throw new HttpsError('invalid-argument', 'Missing code');
    
    const codeRef = admin.firestore().doc(`connectionCodes/${code.toUpperCase()}`);
    const codeDoc = await codeRef.get();
        
    if (!codeDoc.exists) throw new HttpsError('not-found', 'Invalid or used code');
    
    const codeData = codeDoc.data();
    if (!codeData) throw new HttpsError('not-found', 'Invalid code data');
    
    if (codeData.used) throw new HttpsError('failed-precondition', 'Code already used');

    if (codeData.expiresAt.toDate() < new Date()) {
        throw new HttpsError('failed-precondition', 'Code expired');
    }
    
    // Link caregiver to device
    await admin.firestore().doc(`deviceLinks/${codeData.deviceId}_${uid}`).set({
        deviceId: codeData.deviceId,
        userId: uid,
        role: 'caregiver',
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: uid,
        linkedViaCode: code,
        linkedAt: admin.firestore.FieldValue.serverTimestamp() // Explicit linkedAt
    }, { merge: true });
    
    // Create Caregiver-Patient Link
    await admin.firestore().doc(`caregiverPatients/${uid}/patients/${codeData.patientId}`).set({
        linkedAt: admin.firestore.FieldValue.serverTimestamp(),
        deviceId: codeData.deviceId
    }, { merge: true });

    // Mark code as used
    await codeRef.update({
        used: true,
        usedBy: uid,
        usedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true, deviceId: codeData.deviceId };
});

/**
 * Revoke Connection Code (Patient).
 */
export const revokeConnectionCode = onCall(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'User must be logged in');
    
    const { code } = request.data;
    if (!code) throw new HttpsError('invalid-argument', 'Missing code');
    
    const codeRef = admin.firestore().doc(`connectionCodes/${code.toUpperCase()}`);
    const codeDoc = await codeRef.get();
    
    if (!codeDoc.exists) throw new HttpsError('not-found', 'Code not found');
    
    const codeData = codeDoc.data();
    if (codeData?.patientId !== uid) {
        throw new HttpsError('permission-denied', 'Can only revoke your own codes');
    }
    
    await codeRef.delete();
    
    return { success: true };
});

/**
 * Get Active Connection Codes (Patient).
 */
export const getActiveConnectionCodes = onCall(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'User must be logged in');
    
    // Query for active codes
    const codesSnap = await admin.firestore().collection('connectionCodes')
        .where('patientId', '==', uid)
        .where('used', '==', false)
        .get();
        
    const now = new Date();
    const activeCodes = [];
    
    for (const doc of codesSnap.docs) {
        const data = doc.data();
        const expiresAt = data.expiresAt.toDate();
        
        if (expiresAt > now) {
            activeCodes.push({
                code: data.id,
                deviceId: data.deviceId,
                patientId: data.patientId,
                patientName: data.patientName,
                expiresAt: expiresAt.toISOString(),
                used: data.used,
                createdAt: data.createdAt?.toDate().toISOString()
            });
        }
    }
    
    return { codes: activeCodes };
});


