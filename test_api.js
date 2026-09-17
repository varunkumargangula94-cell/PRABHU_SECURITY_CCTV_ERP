const http = require('http');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Running End-to-End API Verification Tests...\n');

  // Test 1: Admin Login
  console.log('Test 1: Admin Login (Lankaprabhu / Chiru@123)...');
  const loginRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { username: 'Lankaprabhu', password: 'Chiru@123' });

  if (loginRes.status === 200 && loginRes.body.token) {
    console.log('✅ Admin Login Successful. Received JWT token.');
  } else {
    console.error('❌ Admin Login Failed:', loginRes.body);
    process.exit(1);
  }

  const token = loginRes.body.token;

  // Test 2: Submit Customer Booking
  console.log('\nTest 2: Customer Booking Submission...');
  const randomDays = Math.floor(Math.random() * 100) + 10;
  const futureDate = new Date(Date.now() + randomDays * 86400000).toISOString().split('T')[0];
  const bookingRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/bookings',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    customer_name: 'Suresh Kumar',
    mobile: '9876543210',
    house_number: '12-45',
    street: 'Main Road',
    area: 'Green Colony',
    city: 'Guntur',
    state: 'Andhra Pradesh',
    pincode: '522001',
    installation_date: futureDate,
    time_slot: '04:00 PM - 06:00 PM',
    cctv_requirement: '4 Cameras',
    camera_count: 4,
    customer_message: 'Please bring 4K dome cameras.'
  });

  if (bookingRes.status === 201 && bookingRes.body.booking_id) {
    console.log(`✅ Booking Successful! Booking ID: ${bookingRes.body.booking_id}`);
  } else {
    console.error('❌ Customer Booking Failed:', bookingRes.body);
    process.exit(1);
  }

  // Test 3: Admin Dashboard Metrics
  console.log('\nTest 3: Fetching Admin Dashboard Metrics...');
  const dashRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/dashboard',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (dashRes.status === 200 && dashRes.body.stats) {
    console.log('✅ Admin Dashboard Stats Retrieved:');
    console.log(`   - Total Bookings: ${dashRes.body.stats.total_bookings}`);
    console.log(`   - New Requests:   ${dashRes.body.stats.new_requests}`);
    console.log(`   - Work Photos:    ${dashRes.body.stats.total_work_photos}`);
  } else {
    console.error('❌ Dashboard Stats Failed:', dashRes.body);
    process.exit(1);
  }

  // Test 4: Submit Review
  console.log('\nTest 4: Customer Review Submission...');
  const revRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/reviews',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    customer_name: 'Ananya Sharma',
    rating: 5,
    review_text: 'Superb CCTV camera clarity and fast doorstep installation!'
  });

  if (revRes.status === 201 && revRes.body.review.status === 'PENDING') {
    console.log('✅ Review Submitted Successfully (Default status: PENDING).');
  } else {
    console.error('❌ Review Submission Failed:', revRes.body);
    process.exit(1);
  }

  // Test 5: Public Work Photos
  console.log('\nTest 5: Public Work Photos Retrieval...');
  const photoRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/work-photos',
    method: 'GET'
  });

  if (photoRes.status === 200 && photoRes.body.work_photos.length > 0) {
    console.log(`✅ Public Work Photos Retrieved: ${photoRes.body.work_photos.length} photos available.`);
  } else {
    console.error('❌ Work Photos Retrieval Failed:', photoRes.body);
    process.exit(1);
  }

  // Test 6: Combo Offers API
  console.log('\nTest 6: Combo Offers Public & Admin Retrieval...');
  const comboRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/combo-offers',
    method: 'GET'
  });

  if (comboRes.status === 200 && comboRes.body.combo_offers.length > 0) {
    console.log(`✅ Public Combo Offers Retrieved: ${comboRes.body.combo_offers.length} combos available.`);
  } else {
    console.error('❌ Public Combo Offers Retrieval Failed:', comboRes.body);
    process.exit(1);
  }

  const adminComboRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/combo-offers',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (adminComboRes.status === 200 && adminComboRes.body.combo_offers.length > 0) {
    console.log(`✅ Admin Combo Offers Retrieved: ${adminComboRes.body.combo_offers.length} combos available.`);
  } else {
    console.error('❌ Admin Combo Offers Retrieval Failed:', adminComboRes.body);
    process.exit(1);
  }

  // Test 7: Customer Support Query Submission & Admin Fetch
  console.log('\nTest 7: Customer Support Query Submission & Admin Retrieval...');
  const supRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/support-tickets',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    customer_name: 'K. Venkatesh',
    mobile: '9123456789',
    subject: 'Camera Price Quote Question',
    message: 'I want a quotation for 8 cameras for my factory in Jeedimetla.'
  });

  if (supRes.status === 201 && supRes.body.ticket_id) {
    console.log(`✅ Customer Support Query Submitted! Ticket ID: ${supRes.body.ticket_id}`);
  } else {
    console.error('❌ Support Ticket Submission Failed:', supRes.body);
    process.exit(1);
  }

  const adminSupRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/support-tickets',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (adminSupRes.status === 200 && adminSupRes.body.tickets.length > 0) {
    console.log(`✅ Admin Support Tickets Retrieved: ${adminSupRes.body.tickets.length} tickets found.`);
  } else {
    console.error('❌ Admin Support Tickets Retrieval Failed:', adminSupRes.body);
    process.exit(1);
  }

  // Test 8: Booking Soft Delete & Recycle Bin
  console.log('\nTest 8: Booking Soft-Delete & Recycle Bin Restoration...');
  const createdBookingId = bookingRes.body.booking.id;

  const softDelRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/admin/bookings/${createdBookingId}/delete`,
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (softDelRes.status === 200) {
    console.log('✅ Booking Moved to Recycle Bin.');
  } else {
    console.error('❌ Soft Delete Failed:', softDelRes.body);
    process.exit(1);
  }

  const binRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/bin',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (binRes.status === 200 && binRes.body.bin_items.length > 0) {
    console.log(`✅ Recycle Bin Verified: ${binRes.body.bin_items.length} items in Bin.`);
  } else {
    console.error('❌ Bin Fetch Failed:', binRes.body);
    process.exit(1);
  }

  const restoreRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/admin/bookings/${createdBookingId}/restore`,
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (restoreRes.status === 200) {
    console.log('✅ Booking Successfully Restored from Recycle Bin to Active List!');
  } else {
    console.error('❌ Restore Failed:', restoreRes.body);
    process.exit(1);
  }

  console.log('\n🎉 ALL END-TO-END VERIFICATION TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('Test script error:', err);
  process.exit(1);
});
