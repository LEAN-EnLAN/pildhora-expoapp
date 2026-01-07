 $ProjectId = "pildhora-app2"                                                                                                                      
  $PatientUid = "vtBGfPfbEhU6Z7njl1YsujrUexc2"                                                                                                      
  $CaregiverUid = "ZsoeNjnLOGgj1rNomcbJF7QSWTZ2"                                                                                                    
  $DeviceId = "device-001"                                                                                                                          
                                                                                                                                                    
  firebase use $ProjectId                                                                                                                           
                                                                                                                                                    
  # 1) Firestore: set patient deviceId                                                                                                              
  firebase firestore:documents:set "users/$PatientUid" --data "{`"deviceId`": `"$DeviceId`"}" --merge                                               
                                                                                                                                                    
  # 2) Firestore: ensure devices/{deviceId}.linkedUsers                                                                                             
  firebase firestore:documents:set "devices/$DeviceId" --data "{`"linkedUsers`\": {`"$PatientUid`\": `"patient`\", `"$CaregiverUid`\":              
  `"caregiver`\"}}" --merge                                                                                                                         
                                                                                                                                                    
  # 3) RTDB: device state                                                                                                                           
  firebase database:update "/devices/$DeviceId/state" --data '{                                                                                     
    "is_online": true,                                                                                                                              
    "battery_level": 80,                                                                                                                            
    "last_seen": "2025-11-16T12:34:56.000Z",                                                                                                        
    "current_status": "IDLE"                                                                                                                        
  }'                                                                                                                                                
                                                                                                                                                    
  # 4) RTDB: user → device links (triggers Cloud Functions to create deviceLinks)                                                                   
  firebase database:update "/users/$PatientUid/devices"   --data "{`"$DeviceId`": true}"                                                            
  firebase database:update "/users/$CaregiverUid/devices" --data "{`"$DeviceId`": true}" 