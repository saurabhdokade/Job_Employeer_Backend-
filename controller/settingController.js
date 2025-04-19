const UserSettings = require('../model/settingModel');
const User = require('../model/employerModel'); // To fetch email if needed

// Create or Update User Settings
exports.saveUserSettings = async (req, res) => {
  try {
    const userId = req.user.id; // Authenticated user's ID
    const { appPreferences, notifications, email, phone } = req.body;

    // Check if settings already exist
    let settings = await UserSettings.findOne({ userId });

    if (settings) {
      // Update existing settings
      settings.appPreferences = appPreferences;
      settings.notifications = notifications;
      settings.email = email;
      settings.phone = phone;
    } else {
      // Create new settings
      settings = new UserSettings({
        userId,
        appPreferences,
        notifications,
        email,
        phone
      });
    }

    await settings.save();

    res.status(200).json({
      success: true,
      message: 'User settings saved successfully',
      data: settings
    });

  } catch (err) {
    console.error('Error saving user settings:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Get User Settings
exports.getUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = await UserSettings.findOne({ userId });

    if (!settings) {
      return res.status(404).json({ success: false, message: 'Settings not found' });
    }

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
