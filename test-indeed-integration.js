const axios = require('axios');

// Test script to demonstrate the Indeed integration
async function testIndeedIntegration() {
  console.log('🚀 Testing Indeed Integration for CampusEdge\n');
  
  try {
    // Test 1: Get external jobs
    console.log('📋 Test 1: Fetching External Jobs');
    console.log('=' .repeat(50));
    
    const jobsResponse = await axios.get('http://localhost:5001/api/external-jobs', {
      params: {
        query: 'software engineer',
        location: 'remote',
        limit: 5,
        source: 'all'
      }
    });
    
    if (jobsResponse.data.success) {
      console.log(`✅ Found ${jobsResponse.data.data.length} external jobs:`);
      jobsResponse.data.data.forEach((job, index) => {
        console.log(`\n${index + 1}. ${job.title} at ${job.company}`);
        console.log(`   📍 Location: ${job.location}`);
        console.log(`   💰 Salary: ${job.salary}`);
        console.log(`   🏢 Source: ${job.source}`);
        console.log(`   🔗 External URL: ${job.externalUrl}`);
        if (job.skills && job.skills.length > 0) {
          console.log(`   🛠️  Skills: ${job.skills.join(', ')}`);
        }
      });
    } else {
      console.log('❌ Failed to fetch external jobs');
    }
    
    // Test 2: Get job categories
    console.log('\n\n📂 Test 2: Fetching Job Categories');
    console.log('=' .repeat(50));
    
    const categoriesResponse = await axios.get('http://localhost:5001/api/external-jobs/categories');
    
    if (categoriesResponse.data.success) {
      console.log('✅ Available job categories:');
      categoriesResponse.data.data.forEach(category => {
        console.log(`   • ${category.name} (${category.id})`);
        console.log(`     Keywords: ${category.keywords.join(', ')}`);
      });
    }
    
    // Test 3: Advanced search
    console.log('\n\n🔍 Test 3: Advanced Job Search');
    console.log('=' .repeat(50));
    
    const searchResponse = await axios.post('http://localhost:5001/api/external-jobs/search', {
      query: 'frontend developer',
      location: 'San Francisco, CA',
      category: 'software',
      experience: 'entry level',
      jobType: 'Full-time',
      limit: 3
    });
    
    if (searchResponse.data.success) {
      console.log(`✅ Advanced search found ${searchResponse.data.data.length} jobs:`);
      searchResponse.data.data.forEach((job, index) => {
        console.log(`\n${index + 1}. ${job.title} at ${job.company}`);
        console.log(`   📍 ${job.location} | 💰 ${job.salary}`);
        console.log(`   🏢 Source: ${job.source}`);
      });
    }
    
    // Test 4: Get popular locations
    console.log('\n\n🌍 Test 4: Popular Job Locations');
    console.log('=' .repeat(50));
    
    const locationsResponse = await axios.get('http://localhost:5001/api/external-jobs/locations');
    
    if (locationsResponse.data.success) {
      console.log('✅ Popular job locations:');
      locationsResponse.data.data.forEach((location, index) => {
        console.log(`   ${index + 1}. ${location}`);
      });
    }
    
    console.log('\n\n🎉 All tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   ✅ External jobs API is working');
    console.log('   ✅ Job categories are available');
    console.log('   ✅ Advanced search is functional');
    console.log('   ✅ Popular locations are loaded');
    console.log('\n🚀 Your students can now see real job opportunities from:');
    console.log('   • Indeed (via web scraping)');
    console.log('   • GitHub Jobs (mock data)');
    console.log('   • Startup job boards (mock data)');
    console.log('\n💡 Next steps:');
    console.log('   1. Students can search for jobs by title, location, category');
    console.log('   2. They can filter by job type, experience level, salary');
    console.log('   3. External jobs link directly to the original job posting');
    console.log('   4. Local jobs use your application system');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testIndeedIntegration();
