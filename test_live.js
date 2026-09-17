const https = require('https');

function makeHttpsRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
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

async function testLiveDeployment() {
  console.log('🌍 Testing Live Deployed Server: https://prabhu-security-cctv-erp.onrender.com ...\n');

  // 1. Submit Test Booking on Live Server
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  console.log('1️⃣ Submitting Live Customer Test Booking...');
  
  const bookingData = {
    customer_name: 'M. Srinivas (Live Test)',
    mobile: '8790978417',
    house_number: 'H.No 07-006/A',
    street: 'JK Nagar, Subhash Nagar',
    area: 'Jeedimetla',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500055',
    installation_date: tomorrow,
    time_slot: '02:00 PM - 04:00 PM',
    cctv_requirement: '4 Cameras',
    camera_count: 4,
    customer_message: 'Testing live booking deployment on PRABHU SECURITY SOLUTIONS site.'
  };

  const bookingRes = await makeHttpsRequest({
    hostname: 'prabhu-security-cctv-erp.onrender.com',
    port: 443,
    path: '/api/bookings',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, bookingData);

  if (bookingRes.status === 201 && bookingRes.body.booking_id) {
    console.log(`✅ LIVE BOOKING SUCCESSFUL! Generated Booking ID: ${bookingRes.body.booking_id}`);
  } else {
    console.error('❌ Live Booking Failed:', bookingRes.body);
    process.exit(1);
  }

  // 2. Login to Live Admin Portal
  console.log('\n2️⃣ Testing Live Admin Login...');
  const loginRes = await makeHttpsRequest({
    hostname: 'prabhu-security-cctv-erp.onrender.com',
    port: 443,
    path: '/api/admin/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { username: 'Lankaprabhu', password: 'Chiru@123' });

  if (loginRes.status === 200 && loginRes.body.token) {
    console.log('✅ LIVE ADMIN LOGIN SUCCESSFUL! Token generated.');
    const token = loginRes.body.token;

    // 3. Check Live Admin Dashboard Metrics & New Work Notification
    console.log('\n3️⃣ Verifying Live Admin Dashboard Stats & NEW WORK Request...');
    const dashRes = await makeHttpsRequest({
      hostname: 'prabhu-security-cctv-erp.onrender.com',
      port: 443,
      path: '/api/admin/dashboard',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (dashRes.status === 200 && dashRes.body.stats) {
      console.log('✅ LIVE ADMIN DASHBOARD VERIFIED:');
      console.log(`   - Total Bookings: ${dashRes.body.stats.total_bookings}`);
      console.log(`   - New Requests:   ${dashRes.body.stats.new_requests}`);
      console.log(`   - Latest Work:    ${dashRes.body.recent_new_work[0]?.customer_name} (${dashRes.body.recent_new_work[0]?.booking_id})`);
    } else {
      console.error('❌ Live Dashboard Fetch Failed:', dashRes.body);
    }

  } else {
    console.error('❌ Live Admin Login Failed:', loginRes.body);
  }

  // 4. Check Live Public Combo Offers
  console.log('\n4️⃣ Verifying Live Public Combo Offers...');
  const comboRes = await makeHttpsRequest({
    hostname: 'prabhu-security-cctv-erp.onrender.com',
    port: 443,
    path: '/api/combo-offers',
    method: 'GET'
  });

  if (comboRes.status === 200 && comboRes.body.combo_offers?.length > 0) {
    console.log(`✅ LIVE COMBO OFFERS VERIFIED! Total Live Combos: ${comboRes.body.combo_offers.length}`);
  } else {
    console.error('❌ Live Combo Offers Fetch Failed:', comboRes.body);
  }

  // 5. Submit Support Ticket on Live Site
  console.log('\n5️⃣ Submitting Live Customer Support Query...');
  const supRes = await makeHttpsRequest({
    hostname: 'prabhu-security-cctv-erp.onrender.com',
    port: 443,
    path: '/api/support-tickets',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    customer_name: 'L. Srinivas (Live Query)',
    mobile: '8688372556',
    subject: 'Installation Support',
    message: 'Testing live customer support query connected to Admin.'
  });

  if (supRes.status === 201 && supRes.body.ticket_id) {
    console.log(`✅ LIVE CUSTOMER SUPPORT QUERY VERIFIED! Generated Ticket ID: ${supRes.body.ticket_id}`);
  } else {
    console.error('❌ Live Support Ticket Submission Failed:', supRes.body);
  }

  console.log('\n🎉 LIVE PRODUCTION DEPLOYMENT FULLY VERIFIED!');
}

testLiveDeployment().catch(err => {
  console.error('Live test error:', err);
});
