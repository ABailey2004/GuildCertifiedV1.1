// Google Apps Script for handling write operations to Google Sheets
// This script should be deployed as a web app to handle POST requests

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const payload = data.data;
    
    switch (action) {
      case 'addServer':
        return addServer(payload);
      case 'addReview':
        return addReview(payload);
      case 'addUser':
        return addUser(payload);
      case 'updateUser':
        return updateUser(payload);
      default:
        return ContentService
          .createTextOutput(JSON.stringify({success: false, error: 'Invalid action'}))
          .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function addServer(serverData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Servers');
  
  // Generate a unique ID
  const id = Utilities.getUuid();
  
  // Prepare the row data
  const rowData = [
    id,
    serverData.name,
    serverData.description,
    serverData.category,
    serverData.invite_link,
    serverData.tags.join(', '),
    serverData.date_added,
    serverData.average_rating,
    serverData.review_count
  ];
  
  // Add the row
  sheet.appendRow(rowData);
  
  return ContentService
    .createTextOutput(JSON.stringify({success: true, id: id}))
    .setMimeType(ContentService.MimeType.JSON);
}

function addReview(reviewData) {
  const reviewSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Reviews');
  const serverSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Servers');
  
  // Generate a unique ID for the review
  const reviewId = Utilities.getUuid();
  
  // Add the review
  const reviewRowData = [
    reviewId,
    reviewData.server_id,
    reviewData.reviewer_name,
    reviewData.rating,
    reviewData.review_text,
    reviewData.date
  ];
  
  reviewSheet.appendRow(reviewRowData);
  
  // Update server statistics
  updateServerStats(reviewData.server_id, serverSheet, reviewSheet);
  
  return ContentService
    .createTextOutput(JSON.stringify({success: true, id: reviewId}))
    .setMimeType(ContentService.MimeType.JSON);
}

function updateServerStats(serverId, serverSheet, reviewSheet) {
  // Find the server row
  const serverData = serverSheet.getDataRange().getValues();
  let serverRowIndex = -1;
  
  for (let i = 1; i < serverData.length; i++) {
    if (serverData[i][0] === serverId) { // ID is in column A (index 0)
      serverRowIndex = i + 1; // +1 because getRange is 1-indexed
      break;
    }
  }
  
  if (serverRowIndex === -1) return;
  
  // Get all reviews for this server
  const reviewData = reviewSheet.getDataRange().getValues();
  const serverReviews = [];
  
  for (let i = 1; i < reviewData.length; i++) {
    if (reviewData[i][1] === serverId) { // server_id is in column B (index 1)
      serverReviews.push(parseInt(reviewData[i][3])); // rating is in column D (index 3)
    }
  }
  
  // Calculate average rating
  const averageRating = serverReviews.length > 0 
    ? serverReviews.reduce((sum, rating) => sum + rating, 0) / serverReviews.length 
    : 0;
  
  // Update the server sheet
  serverSheet.getRange(serverRowIndex, 8).setValue(averageRating); // Column H (average_rating)
  serverSheet.getRange(serverRowIndex, 9).setValue(serverReviews.length); // Column I (review_count)
}

function addUser(userData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  
  // Prepare the row data
  const rowData = [
    userData.id,
    userData.email,
    userData.name,
    userData.display_name || userData.name,
    userData.avatar || '',
    userData.provider,
    userData.profile_type || '',
    userData.description || '',
    userData.website || '',
    JSON.stringify(userData.social_links || {}),
    userData.created_at,
    userData.last_login || userData.created_at,
    userData.profile_completed || false,
    userData.setup_completed_at || ''
  ];
  
  // Add the row
  sheet.appendRow(rowData);
  
  return ContentService
    .createTextOutput(JSON.stringify({success: true, id: userData.id}))
    .setMimeType(ContentService.MimeType.JSON);
}

function updateUser(userData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  const data = sheet.getDataRange().getValues();
  
  // Find the user row
  let userRowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userData.id) { // ID is in column A (index 0)
      userRowIndex = i + 1; // +1 because getRange is 1-indexed
      break;
    }
  }
  
  if (userRowIndex === -1) {
    // User doesn't exist, add them
    return addUser(userData);
  }
  
  // Update the user data
  const rowData = [
    userData.id,
    userData.email,
    userData.name,
    userData.display_name || userData.name,
    userData.avatar || '',
    userData.provider,
    userData.profile_type || '',
    userData.description || '',
    userData.website || '',
    JSON.stringify(userData.social_links || {}),
    userData.created_at,
    userData.last_login || new Date().toISOString(),
    userData.profile_completed || false,
    userData.setup_completed_at || ''
  ];
  
  // Update the row
  sheet.getRange(userRowIndex, 1, 1, rowData.length).setValues([rowData]);
  
  return ContentService
    .createTextOutput(JSON.stringify({success: true, id: userData.id}))
    .setMimeType(ContentService.MimeType.JSON);
}

// Test function to set up the sheets with proper headers
function setupSheets() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Set up Servers sheet
  let serversSheet = spreadsheet.getSheetByName('Servers');
  if (!serversSheet) {
    serversSheet = spreadsheet.insertSheet('Servers');
  }
  
  const serverHeaders = [
    'ID',
    'Name', 
    'Description', 
    'Category', 
    'Invite_Link', 
    'Tags', 
    'Date_Added', 
    'Average_Rating', 
    'Review_Count'
  ];
  
  serversSheet.getRange(1, 1, 1, serverHeaders.length).setValues([serverHeaders]);
  
  // Set up Reviews sheet
  let reviewsSheet = spreadsheet.getSheetByName('Reviews');
  if (!reviewsSheet) {
    reviewsSheet = spreadsheet.insertSheet('Reviews');
  }
  
  const reviewHeaders = [
    'ID',
    'Server_ID',
    'Reviewer_Name',
    'Rating',
    'Review_Text',
    'Date'
  ];
  
  reviewsSheet.getRange(1, 1, 1, reviewHeaders.length).setValues([reviewHeaders]);
  
  // Set up Users sheet
  let usersSheet = spreadsheet.getSheetByName('Users');
  if (!usersSheet) {
    usersSheet = spreadsheet.insertSheet('Users');
  }
  
  const userHeaders = [
    'ID',
    'Email',
    'Name',
    'Display_Name',
    'Avatar',
    'Provider',
    'Profile_Type',
    'Description',
    'Website',
    'Social_Links',
    'Created_At',
    'Last_Login',
    'Profile_Completed',
    'Setup_Completed_At'
  ];
  
  usersSheet.getRange(1, 1, 1, userHeaders.length).setValues([userHeaders]);
  
  Logger.log('Sheets set up successfully!');
}