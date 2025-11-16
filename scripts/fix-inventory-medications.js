/**
 * Script to fix medications with missing quantityType field
 * 
 * This script:
 * 1. Finds all medications with trackInventory=true but no quantityType
 * 2. Infers quantityType from doseUnit
 * 3. Updates the medications in Firestore
 * 
 * Run with: node scripts/fix-inventory-medications.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to provide credentials)
// admin.initializeApp({
//   credential: admin.credential.cert('./serviceAccountKey.json')
// });

const db = admin.firestore();

/**
 * Infer quantity type from dose unit
 */
function inferQuantityType(doseUnit, dosage) {
  const unit = (doseUnit || '').toLowerCase();
  const dosageStr = (dosage || '').toLowerCase();
  
  // Check for liquid indicators
  if (unit.includes('ml') || unit.includes('l') || 
      dosageStr.includes('ml') || dosageStr.includes('líquido')) {
    return 'liquid';
  }
  
  // Check for cream/topical indicators
  if (unit.includes('g') && !unit.includes('mg') && !unit.includes('mcg') ||
      dosageStr.includes('crema') || dosageStr.includes('cream')) {
    return 'cream';
  }
  
  // Check for drops
  if (unit.includes('gotas') || unit.includes('drops') || 
      dosageStr.includes('gotas') || dosageStr.includes('drops')) {
    return 'drops';
  }
  
  // Check for sprays
  if (unit.includes('spray') || dosageStr.includes('spray')) {
    return 'spray';
  }
  
  // Check for inhalers
  if (unit.includes('puff') || unit.includes('inhalación') ||
      dosageStr.includes('inhalador') || dosageStr.includes('inhaler')) {
    return 'inhaler';
  }
  
  // Default to tablets for mg, mcg, units, or unknown
  return 'tablets';
}

/**
 * Main function to fix medications
 */
async function fixMedications() {
  try {
    console.log('🔍 Searching for medications with missing quantityType...\n');
    
    // Query medications with trackInventory=true
    const snapshot = await db.collection('medications')
      .where('trackInventory', '==', true)
      .get();
    
    console.log(`Found ${snapshot.size} medications with inventory tracking enabled\n`);
    
    const toFix = [];
    const alreadyFixed = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      if (!data.quantityType) {
        toFix.push({ id: doc.id, data });
      } else {
        alreadyFixed.push({ id: doc.id, data });
      }
    });
    
    console.log(`✅ ${alreadyFixed.length} medications already have quantityType`);
    console.log(`⚠️  ${toFix.length} medications need to be fixed\n`);
    
    if (toFix.length === 0) {
      console.log('✨ All medications are already fixed!');
      return;
    }
    
    console.log('Medications to fix:');
    console.log('-------------------');
    
    for (const med of toFix) {
      const inferredType = inferQuantityType(med.data.doseUnit, med.data.dosage);
      
      console.log(`📋 ${med.data.name}`);
      console.log(`   ID: ${med.id}`);
      console.log(`   Dose: ${med.data.doseValue || 'N/A'} ${med.data.doseUnit || 'N/A'}`);
      console.log(`   Legacy dosage: ${med.data.dosage || 'N/A'}`);
      console.log(`   Current quantity: ${med.data.currentQuantity || 'N/A'}`);
      console.log(`   Inferred type: ${inferredType}`);
      console.log('');
    }
    
    // Ask for confirmation (in a real script, you'd use readline or similar)
    console.log('\n⚠️  IMPORTANT: Review the inferred types above');
    console.log('To apply these changes, uncomment the update code below\n');
    
    // UNCOMMENT THIS SECTION TO ACTUALLY APPLY THE FIXES
    /*
    console.log('Applying fixes...\n');
    
    const batch = db.batch();
    let updateCount = 0;
    
    for (const med of toFix) {
      const inferredType = inferQuantityType(med.data.doseUnit, med.data.dosage);
      const docRef = db.collection('medications').doc(med.id);
      
      batch.update(docRef, {
        quantityType: inferredType,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      updateCount++;
      
      // Firestore batch limit is 500 operations
      if (updateCount % 500 === 0) {
        await batch.commit();
        console.log(`✅ Updated ${updateCount} medications...`);
      }
    }
    
    // Commit remaining updates
    if (updateCount % 500 !== 0) {
      await batch.commit();
    }
    
    console.log(`\n✅ Successfully updated ${updateCount} medications!`);
    */
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  fixMedications()
    .then(() => {
      console.log('\n✨ Script completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { fixMedications, inferQuantityType };
