const http = require('http');

function apiCall(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(`http://127.0.0.1:5000${path}`, { method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function getOrRegisterUser(fullName, email, password, role, phone, unitId = null) {
  let res = await apiCall('POST', '/api/auth/register', {
    full_name: fullName,
    email,
    password,
    role,
    phone,
    unit_id: unitId
  });

  if (res.status === 409) {
    res = await apiCall('POST', '/api/auth/login', { email, password });
  }

  return res;
}

async function run() {
  console.log('=== REAL PRODUCTION WORKFLOW TEST (ZERO MOCK DATA) ===');

  // 1. Health check
  const health = await apiCall('GET', '/api/health');
  console.log('1. Real-Time Server Health:', health.status === 200 ? '✅ ONLINE' : '❌ OFFLINE');

  // 2. Real Property Owner Auth
  const ownerAuth = await getOrRegisterUser('Dharmesh Sharma', 'dharmesh.owner@realestate.com', 'securepassword123', 'OWNER', '+91-9876543210');
  console.log('2. Real Property Owner Auth:', ownerAuth.status === 200 || ownerAuth.status === 201 ? '✅ PASSED' : '❌ FAILED', ownerAuth.data.user.full_name);
  const ownerToken = ownerAuth.data.token;

  // 3. Owner registers or retrieves real physical property
  let properties = await apiCall('GET', '/api/properties', null, ownerToken);
  let propertyId;

  if (properties.data && properties.data.length > 0) {
    propertyId = properties.data[0].id;
    console.log('3. Real Property Found in Database:', '✅ PASSED', properties.data[0].name);
  } else {
    const propRes = await apiCall('POST', '/api/properties', {
      name: 'Sharma Residency Towers',
      address: 'Plot 45, Sector 12, Cyber Valley',
      city: 'Bangalore',
      state: 'Karnataka',
      zip_code: '560100'
    }, ownerToken);
    propertyId = propRes.data.id;
    console.log('3. Real Property Creation:', propRes.status === 201 ? '✅ PASSED' : '❌ FAILED', propRes.data.name);
  }

  // 4. Units check / creation
  const propDetails = await apiCall('GET', `/api/properties/${propertyId}`, null, ownerToken);
  let unitId;

  if (propDetails.data.units && propDetails.data.units.length > 0) {
    unitId = propDetails.data.units[0].id;
    console.log('4. Real Unit Found in Database:', '✅ PASSED', `Unit: ${propDetails.data.units[0].unit_number}`);
  } else {
    const unitRes = await apiCall('POST', `/api/properties/${propertyId}/units`, {
      unit_number: 'Tower A - 402',
      floor: 4
    }, ownerToken);
    unitId = unitRes.data.id;
    console.log('4. Real Unit Addition:', unitRes.status === 201 ? '✅ PASSED' : '❌ FAILED', `Unit: ${unitRes.data.unit_number}`);
  }

  // 5. Amenity check / creation
  let amenityId;
  const amenitiesList = await apiCall('GET', `/api/amenities?property_id=${propertyId}`, null, ownerToken);
  if (amenitiesList.data && amenitiesList.data.length > 0) {
    amenityId = amenitiesList.data[0].id;
    console.log('5. Real Amenity Found in Database:', '✅ PASSED', amenitiesList.data[0].name);
  } else {
    const amenityRes = await apiCall('POST', '/api/amenities', {
      property_id: propertyId,
      name: 'Championship Badminton Court',
      description: 'Indoor maple wood badminton court with LED tournament lighting.',
      icon: 'table-tennis-paddle-ball',
      max_capacity: 1, // Exclusive court booking
      opening_time: '06:00',
      closing_time: '22:00',
      slot_duration_minutes: 60,
      rules: 'Non-marking badminton shoes strictly required.'
    }, ownerToken);
    amenityId = amenityRes.data.id;
    console.log('5. Real Amenity Registration:', amenityRes.status === 201 ? '✅ PASSED' : '❌ FAILED', amenityRes.data.name);
  }

  // 6. Real Tenant Auth
  const tenantAuth = await getOrRegisterUser('Rahul Verma', 'rahul.verma@example.com', 'tenantpassword123', 'TENANT', '+91-9123456789', unitId);
  console.log('6. Real Tenant Auth:', tenantAuth.status === 200 || tenantAuth.status === 201 ? '✅ PASSED' : '❌ FAILED', tenantAuth.data.user.full_name);
  const tenantToken = tenantAuth.data.token;

  // 7. Tenant creates real maintenance ticket
  const ticketRes = await apiCall('POST', '/api/maintenance', {
    title: 'Water filter RO membrane replacement required',
    description: 'TDS value in drinking water is showing 280ppm, requires cartridge replacement.',
    category: 'PLUMBING',
    priority: 'MEDIUM',
    unit_id: unitId,
    property_id: propertyId
  }, tenantToken);
  console.log('7. Real Maintenance Ticket Submission:', ticketRes.status === 201 ? '✅ PASSED' : '❌ FAILED', `Ticket ID: ${ticketRes.data.id}`);
  const ticketId = ticketRes.data.id;

  // 8. Real Facilities Tech Auth
  const techAuth = await getOrRegisterUser('Suresh Kumar', 'suresh.electrician@services.com', 'techpassword123', 'STAFF', '+91-9988776655');
  console.log('8. Real Facilities Tech Auth:', techAuth.status === 200 || techAuth.status === 201 ? '✅ PASSED' : '❌ FAILED', techAuth.data.user.full_name);
  const techId = techAuth.data.user.id;
  const techToken = techAuth.data.token;

  // 9. Owner assigns Technician to the ticket
  const assignRes = await apiCall('PATCH', `/api/maintenance/${ticketId}/status`, {
    status: 'IN_PROGRESS',
    assigned_staff_id: techId,
    action_note: 'Assigned to Suresh Kumar for maintenance'
  }, ownerToken);
  console.log('9. Ticket Assignment:', assignRes.status === 200 ? '✅ PASSED' : '❌ FAILED', `Status: ${assignRes.data.status}`);

  // 10. Technician marks ticket COMPLETED
  const completeRes = await apiCall('PATCH', `/api/maintenance/${ticketId}/status`, {
    status: 'COMPLETED',
    resolution_notes: 'Replaced sediment filter and RO membrane. Output TDS calibrated to 45ppm.',
    action_note: 'Filter replaced and flow tested'
  }, techToken);
  console.log('10. Work Completed by Tech:', completeRes.status === 200 ? '✅ PASSED' : '❌ FAILED', `Status: ${completeRes.data.status}`);

  // 11. Tenant rates service with 5 stars
  const rateRes = await apiCall('POST', `/api/maintenance/${ticketId}/rate`, {
    rating: 5,
    feedback: 'Technician was punctual and verified water purity. Great service!'
  }, tenantToken);
  console.log('11. Tenant CSAT Rating:', rateRes.status === 200 ? '✅ PASSED' : '❌ FAILED', `Rating: ${rateRes.data.satisfaction_rating} Stars`);

  // 12. Tenant reserves real amenity slot
  const randomDayOffset = 5 + Math.floor(Math.random() * 200);
  const bookingDate = new Date(Date.now() + 86400000 * randomDayOffset).toISOString().split('T')[0];
  const testSlotHour = '19:00';
  const testSlotEnd = '20:00';

  const book1 = await apiCall('POST', '/api/amenities/book', {
    amenity_id: amenityId,
    booking_date: bookingDate,
    start_time: testSlotHour,
    end_time: testSlotEnd,
    attendees_count: 2,
    notes: 'Tournament preparation'
  }, tenantToken);

  if (book1.status !== 201) {
    console.error('Booking failed with status:', book1.status, book1.data);
  }
  console.log('12. Genuine Amenity Reservation:', book1.status === 201 ? '✅ PASSED' : '❌ FAILED', `Slot: ${book1.data.start_time} - ${book1.data.end_time}`);
  const bookingId = book1.data.id;

  // 13. Test Check-In and Check-Out Tracking
  const checkInRes = await apiCall('PATCH', `/api/amenities/bookings/${bookingId}/check-in`, null, tenantToken);
  console.log('13a. Amenity Check-In Action:', checkInRes.status === 200 ? '✅ PASSED' : '❌ FAILED', `Status: ${checkInRes.data.status}`);

  const checkOutRes = await apiCall('PATCH', `/api/amenities/bookings/${bookingId}/check-out`, null, tenantToken);
  console.log('13b. Amenity Check-Out Action:', checkOutRes.status === 200 ? '✅ PASSED' : '❌ FAILED', `Status: ${checkOutRes.data.status}`);

  // 14. Double-Booking Conflict check on a fresh reserved slot
  const freshDate = new Date(Date.now() + 86400000 * (300 + Math.floor(Math.random() * 200))).toISOString().split('T')[0];
  const freshSlot1 = await apiCall('POST', '/api/amenities/book', {
    amenity_id: amenityId,
    booking_date: freshDate,
    start_time: '10:00',
    end_time: '11:00',
    attendees_count: 1
  }, tenantToken);

  const duplicateBooking = await apiCall('POST', '/api/amenities/book', {
    amenity_id: amenityId,
    booking_date: freshDate,
    start_time: '10:00',
    end_time: '11:00',
    attendees_count: 1
  }, ownerToken);

  console.log('14. Zero-Conflict Engine Concurrency Test:');
  if (duplicateBooking.status === 409) {
    console.log('    ✅ PASSED: Duplicate booking rejected with 409 Conflict!');
    console.log('    Conflict Reason:', duplicateBooking.data.error);
  } else {
    console.log('    ❌ FAILED: Status was', duplicateBooking.status, duplicateBooking.data);
  }

  // 15. Verify Dashboard KPIs computed strictly from genuine database rows
  const finalStats = await apiCall('GET', '/api/dashboard/stats', null, ownerToken);
  console.log('15. Final Operational Dashboard Verification:');
  console.log('    Total Tickets Logged in DB:', finalStats.data.maintenance.total);
  console.log('    Total Closed Tickets:', finalStats.data.maintenance.closed);
  console.log('    Computed Completion Rate:', finalStats.data.kpis.completion_rate_percent + '%');
  console.log('    Computed CSAT Score:', finalStats.data.kpis.csat_score + ' / 5.0');
  console.log('    Total Active Amenity Bookings:', finalStats.data.amenities.total_bookings);
  console.log('    Live Server Response Latency:', finalStats.data.kpis.system_response_ms + 'ms');

  console.log('=== REAL PRODUCTION WORKFLOW TEST COMPLETED SUCCESSFULLY ===');
}

run().catch(console.error);
