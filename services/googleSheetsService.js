const { google } = require('googleapis');

class GoogleSheetsService {
  constructor() {
    this.auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    this.spreadsheetId = process.env.GOOGLE_SHEET_ID;
    
    // Local storage for fallback
    this.localAppointments = [];
    this.localMessages = [];
  }

  async addAppointment(appointmentData) {
    try {
      const newId = Date.now().toString();

      const appointmentWithId = {
        ...appointmentData,
        id: newId
      };

      // If Google Sheets is not configured or fails, save locally
      if (!this.spreadsheetId) {
        console.log('Google Sheets not configured, appointment saved locally:', appointmentWithId);
        this.localAppointments.push(appointmentWithId);
        return true;
      }

      const values = [
        [
          newId,
          appointmentData.name,
          appointmentData.phone,
          appointmentData.email,
          appointmentData.service,
          'default_barber', // You can change this to a specific barber
          appointmentData.date,
          appointmentData.time,
          appointmentData.notes,
          appointmentData.status || 'confirmed',
          appointmentData.createdAt,
        ],
      ];

      try {
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: 'appoiments!A:K',
          valueInputOption: 'RAW',
          resource: { values },
        });
      } catch (sheetsError) {
        console.error('Google Sheets API error, using local fallback:', sheetsError.message);
        this.localAppointments.push(appointmentWithId);
        return true;
      }

      return true;
    } catch (error) {
      console.error('Error adding appointment to Google Sheets:', error);
      return true;
    }
  }

  async getAllAppointments() {
    try {
      let sheetsAppointments = [];
      
      // Try to fetch from Google Sheets if configured
      if (this.spreadsheetId) {
        try {
          const response = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: 'appoiments!A:K',
          });

          console.log('Google Sheets response:', response.data);
          
          const rows = response.data.values || [];
          console.log('Raw rows from Google Sheets:', rows);

          const dataRows = rows.slice(1).filter(row => Array.isArray(row) && row.some(v => String(v || '').trim() !== ''));
          if (dataRows.length > 0) {
            sheetsAppointments = dataRows.map((row) => ({
              id: row[0] || '',
              name: row[1] || '',
              phone: row[2] || '',
              email: row[3] || '',
              service: row[4] || '',
              barber: row[5] || '',
              date: row[6] || '',
              time: row[7] || '',
              notes: row[8] || '',
              status: row[9] || 'confirmed',
              createdAt: row[10] || '',
            }));
          }
        } catch (sheetsError) {
          console.error('Google Sheets API error, using local data:', sheetsError.message);
        }
      }

      // If Sheets is configured, return only Sheets data to avoid duplications
      if (this.spreadsheetId) {
        console.log('Appointments from Google Sheets:', sheetsAppointments);
        return sheetsAppointments;
      }
      // Otherwise include local fallback
      const allAppointments = [...this.localAppointments];
      console.log('Appointments from local fallback:', allAppointments);
      return allAppointments;
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return this.localAppointments; // Return at least local appointments on error
    }
  }

  async getAvailableTimes(date) {
    try {
      // If Google Sheets is not configured, return all default times
      if (!this.spreadsheetId) {
        console.log('Google Sheets not configured, returning all available times');
        return [
          '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
          '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
          '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
          '18:00', '18:30', '19:00'
        ];
      }

      const appointments = await this.getAllAppointments();
      const bookedTimes = appointments
        .filter(apt => apt.date === date && apt.status === 'confirmed')
        .map(apt => apt.time);

      const allTimes = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
        '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
        '18:00', '18:30', '19:00'
      ];

      return allTimes.filter(time => !bookedTimes.includes(time));
    } catch (error) {
      console.error('Error fetching available times:', error);
      // Return default times if there's an error
      return [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
        '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
        '18:00', '18:30', '19:00'
      ];
    }
  }

  async updateAppointmentStatus(id, status) {
    try {
      // If Google Sheets is not configured, just log and return success
      if (!this.spreadsheetId) {
        console.log(`Google Sheets not configured, would update appointment ${id} to status: ${status}`);
        return true;
      }

      // Find the row number for this appointment ID
      const appointments = await this.getAllAppointments();
      const appointment = appointments.find(apt => String(apt.id) === String(id));
      
      if (!appointment) {
        console.log(`Appointment with ID ${id} not found`);
        return false;
      }

      // Calculate the row number (header row + index + 1)
      const rowIndex = appointments.findIndex(apt => String(apt.id) === String(id)) + 2; // +2 for header row and 1-based indexing

      const range = `appoiments!J${rowIndex}`; // Status is in column J (10th column)
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: range,
        valueInputOption: 'RAW',
        resource: { values: [[status]] },
      });

      return true;
    } catch (error) {
      console.error('Error updating appointment status:', error);
      return false; // Return false instead of throwing error
    }
  }

  async deleteAppointment(id) {
    try {
      // If Google Sheets is not configured, delete from local store
      if (!this.spreadsheetId) {
        console.log(`Google Sheets not configured, deleting local appointment ${id}`);
        this.localAppointments = this.localAppointments.filter(a => String(a.id) !== String(id));
        return true;
      }

      // Find the row number for this appointment ID
      const appointments = await this.getAllAppointments();
      const appointment = appointments.find(apt => String(apt.id) === String(id));
      
      if (!appointment) {
        console.log(`Appointment with ID ${id} not found`);
        return false;
      }

      // Calculate the row number (header row + index + 1)
      const rowIndex = appointments.findIndex(apt => String(apt.id) === String(id)) + 2; // +2 for header row and 1-based indexing

      const range = `appoiments!A${rowIndex}:K${rowIndex}`;
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: range,
      });

      // Also remove from local fallback store if present
      this.localAppointments = this.localAppointments.filter(a => a.id !== id);
      return true;
    } catch (error) {
      console.error('Error deleting appointment:', error);
      return false; // Return false instead of throwing error
    }
  }

  async ensureAppointmentIds() {
    try {
      if (!this.spreadsheetId) {
        console.log('Google Sheets not configured, ensureAppointmentIds noop');
        return { updated: 0 };
      }
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'appoiments!A:K',
      });
      const rows = response.data.values || [];
      if (rows.length <= 1) return { updated: 0 };
      const dataRows = rows.slice(1);
      let updated = 0;
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const id = (row[0] || '').trim();
        if (!id) {
          const newId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          const targetRow = i + 2;
          const range = `appoiments!A${targetRow}`;
          await this.sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range,
            valueInputOption: 'RAW',
            resource: { values: [[newId]] }
          });
          updated++;
        }
      }
      return { updated };
    } catch (error) {
      console.error('Error ensuring appointment IDs:', error);
      return { updated: 0 };
    }
  }

  async addMessage(messageData) {
    try {
      const messageId = Date.now().toString();
      const messageWithId = {
        id: messageId,
        ...messageData,
        createdAt: new Date().toISOString(),
        handled: 'false'
      };

      console.log('Adding message to Google Sheets:', messageWithId);

      // Try to add to Google Sheets if configured
      if (this.spreadsheetId) {
        try {
          await this.sheets.spreadsheets.values.append({
            spreadsheetId: this.spreadsheetId,
            range: 'messages!A:G',
            valueInputOption: 'RAW',
            resource: {
              values: [[
                messageWithId.id,
                messageWithId.name,
                messageWithId.email,
                messageWithId.phone || '',
                messageWithId.message,
                messageWithId.createdAt,
                messageWithId.handled
              ]]
            }
          });
          console.log('Message added to Google Sheets successfully');
        } catch (sheetsError) {
          console.log('Google Sheets failed for message, saving locally:', sheetsError.message);
          this.localMessages.push(messageWithId);
        }
      } else {
        console.log('Google Sheets not configured, saving message locally');
        this.localMessages.push(messageWithId);
      }

      return messageWithId;
    } catch (error) {
      console.error('Error adding message:', error);
      // Even if everything fails, save to local storage
      const messageWithId = {
        id: Date.now().toString(),
        ...messageData,
        createdAt: new Date().toISOString(),
        handled: 'false'
      };
      this.localMessages.push(messageWithId);
      return messageWithId;
    }
  }

  async getAllMessages() {
    try {
      let sheetsMessages = [];
      
      // Try to fetch from Google Sheets if configured
      if (this.spreadsheetId) {
        try {
          const response = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: 'messages!A:G',
          });

          console.log('Google Sheets messages response:', response.data);
          
          const rows = response.data.values || [];
          console.log('Raw message rows from Google Sheets:', rows);
          
          if (rows.length > 0) {
            sheetsMessages = rows.slice(1).map((row) => ({
              id: row[0] || '',
              name: row[1] || '',
              email: row[2] || '',
              phone: row[3] || '',
              message: row[4] || '',
              createdAt: row[5] || '',
              handled: row[6] || 'false',
            }));
          }
        } catch (sheetsError) {
          console.error('Google Sheets API error, using local messages:', sheetsError.message);
        }
      }

      // Combine Google Sheets messages with local messages
      const allMessages = [...sheetsMessages, ...this.localMessages];
      console.log('Combined messages (Sheets + Local):', allMessages);
      return allMessages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      return this.localMessages; // Return at least local messages on error
    }
  }

  async getAllServices() {
    try {
      // If Google Sheets is not configured, return empty array
      if (!this.spreadsheetId) {
        console.log('Google Sheets not configured, returning empty services array');
        return [];
      }

      console.log('Fetching services from Google Sheets:', this.spreadsheetId);
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'services!A:G',
      });

      console.log('Google Sheets services response:', response.data);
      
      const rows = response.data.values || [];
      console.log('Raw service rows from Google Sheets:', rows);
      
      if (rows.length === 0) {
        console.log('No services found in Google Sheets');
        return [];
      }

      const services = rows.slice(1).map((row) => ({
        id: row[0] || '',
        name: row[1] || '',
        description: row[2] || '',
        duration: row[3] || '',
        price: row[4] || '',
        category: row[5] || '',
        active: row[6] || 'true',
      }));

      console.log('Processed services:', services);
      return services;
    } catch (error) {
      console.error('Detailed error fetching services:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      return []; // Return empty array instead of throwing error
    }
  }

  async addService(serviceData) {
    try {
      const existing = await this.getAllServices();
      const maxId = existing.reduce((max, s) => Math.max(max, parseInt(s.id) || 0), 0);
      const newId = (maxId + 1).toString();

      if (!this.spreadsheetId) {
        console.log('Google Sheets not configured, addService noop');
        return { id: newId, ...serviceData };
      }

      const values = [[
        newId,
        serviceData.name || '',
        serviceData.description || '',
        serviceData.duration_min != null ? String(serviceData.duration_min) : '',
        serviceData.price != null ? String(serviceData.price) : '',
        serviceData.category || '',
        serviceData.active === false ? 'false' : 'true'
      ]];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'services!A:G',
        valueInputOption: 'RAW',
        resource: { values }
      });

      return { id: newId, ...serviceData };
    } catch (error) {
      console.error('Error adding service:', error);
      throw error;
    }
  }

  async updateService(id, serviceData) {
    try {
      if (!this.spreadsheetId) {
        console.log('Google Sheets not configured, updateService noop', id);
        return true;
      }

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'services!A:G',
      });

      const rows = response.data.values || [];
      const dataRows = rows.slice(1);
      const rowIndex = dataRows.findIndex(r => (r[0] || '') === id);
      if (rowIndex === -1) {
        console.log('Service id not found:', id);
        return false;
      }

      const targetRow = rowIndex + 2; // account for header and 1-based index
      const range = `services!A${targetRow}:G${targetRow}`;
      const values = [[
        id,
        serviceData.name || '',
        serviceData.description || '',
        serviceData.duration_min != null ? String(serviceData.duration_min) : '',
        serviceData.price != null ? String(serviceData.price) : '',
        serviceData.category || '',
        serviceData.active === false ? 'false' : 'true'
      ]];

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range,
        valueInputOption: 'RAW',
        resource: { values }
      });

      return true;
    } catch (error) {
      console.error('Error updating service:', error);
      return false;
    }
  }

  async deleteService(id) {
    try {
      if (!this.spreadsheetId) {
        console.log('Google Sheets not configured, deleteService noop', id);
        return true;
      }

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'services!A:G',
      });
      const rows = response.data.values || [];
      const dataRows = rows.slice(1);
      const rowIndex = dataRows.findIndex(r => (r[0] || '') === id);
      if (rowIndex === -1) {
        console.log('Service id not found:', id);
        return false;
      }
      const targetRow = rowIndex + 2;
      const range = `services!A${targetRow}:G${targetRow}`;
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range,
      });
      return true;
    } catch (error) {
      console.error('Error deleting service:', error);
      return false;
    }
  }

  async getAllWork() {
    try {
      if (!this.spreadsheetId) {
        return [];
      }
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'work!A:G',
      });
      const rows = response.data.values || [];
      if (rows.length === 0) return [];
      const workItems = rows.slice(1).map((row) => ({
        id: row[0] || '',
        title: row[1] || '',
        description: row[2] || '',
        category: row[3] || '',
        image_url: row[4] || '',
        active: row[5] || 'true',
        order: row[6] || ''
      }));
      return workItems;
    } catch (error) {
      console.error('Error fetching work items:', error);
      return [];
    }
  }

  async addWork(workData) {
    try {
      const existing = await this.getAllWork();
      const maxId = existing.reduce((max, s) => Math.max(max, parseInt(s.id) || 0), 0);
      const newId = (maxId + 1).toString();
      if (!this.spreadsheetId) {
        return { id: newId, ...workData };
      }
      const values = [[
        newId,
        workData.title || '',
        workData.description || '',
        workData.category || '',
        workData.image_url || '',
        workData.active === false ? 'false' : 'true',
        workData.order != null ? String(workData.order) : ''
      ]];
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'work!A:G',
        valueInputOption: 'RAW',
        resource: { values }
      });
      return { id: newId, ...workData };
    } catch (error) {
      console.error('Error adding work item:', error);
      throw error;
    }
  }

  async updateWork(id, workData) {
    try {
      if (!this.spreadsheetId) {
        return true;
      }
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'work!A:G',
      });
      const rows = response.data.values || [];
      const dataRows = rows.slice(1);
      const rowIndex = dataRows.findIndex(r => (r[0] || '') === id);
      if (rowIndex === -1) {
        return false;
      }
      const targetRow = rowIndex + 2;
      const range = `work!A${targetRow}:G${targetRow}`;
      const values = [[
        id,
        workData.title || '',
        workData.description || '',
        workData.category || '',
        workData.image_url || '',
        workData.active === false ? 'false' : 'true',
        workData.order != null ? String(workData.order) : ''
      ]];
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range,
        valueInputOption: 'RAW',
        resource: { values }
      });
      return true;
    } catch (error) {
      console.error('Error updating work item:', error);
      return false;
    }
  }

  async deleteWork(id) {
    try {
      if (!this.spreadsheetId) {
        return true;
      }
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'work!A:G',
      });
      const rows = response.data.values || [];
      const dataRows = rows.slice(1);
      const rowIndex = dataRows.findIndex(r => (r[0] || '') === id);
      if (rowIndex === -1) {
        return false;
      }
      const targetRow = rowIndex + 2;
      const range = `work!A${targetRow}:G${targetRow}`;
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range,
      });
      return true;
    } catch (error) {
      console.error('Error deleting work item:', error);
      return false;
    }
  }
}

module.exports = new GoogleSheetsService();