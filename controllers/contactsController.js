const { Contact, Device } = require("../config/database");
const { Op } = require("sequelize");

module.exports = {

   list: async (req, res) => {
     try {
       const device = await Device.findOne({ where: { device_id: req.params.deviceId } });
       if (!device) return res.status(404).json({ success: false, error: "Device not found" });

       const rows = await Contact.findAll({ where: { device_id: device.id }, order: [["name", "ASC"]] });
       res.json(rows);
     } catch (e) {
       console.error("Contacts list error:", e);
       res.status(500).json({ success: false, error: "Server error" });
     }
   },

   create: async (req, res) => {
     try {
       const device = await Device.findOne({ where: { device_id: req.params.deviceId } });
       if (!device) return res.status(404).json({ success: false, error: "Device not found" });

       const contact = await Contact.create({
         device_id: device.id,
         name: req.body.name,
         phones: req.body.phones || [],
         emails: req.body.emails || [],
         organization: req.body.organization || "",
         notes: req.body.notes || ""
       });

       res.json({ success: true, data: contact });
     } catch (e) {
       console.error("Create contact error:", e);
       res.status(500).json({ success: false, error: "Server error" });
     }
   },

   update: async (req, res) => {
     try {
       const contact = await Contact.findByPk(req.params.id);
       if (!contact) return res.status(404).json({ success: false, error: "Contact not found" });

       await contact.update({
         name: req.body.name,
         phones: req.body.phones,
         emails: req.body.emails,
         organization: req.body.organization,
         notes: req.body.notes
       });

       res.json({ success: true, data: contact });
     } catch (e) {
       console.error("Update contact error:", e);
       res.status(500).json({ success: false, error: "Server error" });
     }
   },

   delete: async (req, res) => {
     try {
       const removed = await Contact.destroy({ where: { id: req.params.id } });
       res.json({ success: true, removed });
     } catch (e) {
       console.error("Delete contact error:", e);
       res.status(500).json({ success: false, error: "Server error" });
     }
   },

   export: async (req, res) => {
     try {
      const { deviceId } = req.params;
      const device = await Device.findOne({ where: { device_id: deviceId } });
       if (!device) return res.status(404).json({ success: false, error: "Device not found" });

       const contacts = await Contact.findAll({ where: { device_id: device.id } });

       if (req.query.format === "csv") {
        let csv = "name,phones,emails,organization,notes\n";
         contacts.forEach(c => {
           csv += `"${c.name}","${(c.phones || []).join(";")}","${(c.emails || []).join(";")}","${c.organization}","${c.notes}"\n`;
         });

         res.setHeader("Content-Disposition", `attachment; filename=contacts_${deviceId}.csv`);
         res.setHeader("Content-Type", "text/csv");
        return res.send(csv);
      }

      if (req.query.format === "vcf") {
         let vcf = "";
         contacts.forEach(c => {
          vcf += "BEGIN:VCARD\nVERSION:3.0\n";
           vcf += `FN:${c.name}\n`;
           (c.phones || []).forEach(p => vcf += `TEL:${p}\n`);
           (c.emails || []).forEach(e => vcf += `EMAIL:${e}\n`);
           if (c.organization) vcf += `ORG:${c.organization}\n`;
           if (c.notes) vcf += `NOTE:${c.notes}\n`;
           vcf += "END:VCARD\n";
         });

         res.setHeader("Content-Type", "text/vcard");
        return res.send(vcf);
      }

      res.status(400).json({ success: false, error: "Format not supported" });
     } catch (e) {
       console.error("Export contacts error:", e);
       res.status(500).json({ success: false, error: "Server error" });
     }
   }
 };
