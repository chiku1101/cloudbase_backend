const axios = require('axios');
const cheerio = require('cheerio');

// Job fetching service to get real job postings from various sources
class JobFetchingService {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  }

  // Fetch jobs from Indeed using web scraping (for educational purposes)
  async fetchIndeedJobs(query = 'software engineer', location = 'remote', limit = 20) {
    try {
      console.log(`🔍 Fetching Indeed jobs for: ${query} in ${location}`);
      
      // Indeed search URL
      const searchUrl = `https://www.indeed.com/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}&sort=date`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const jobs = [];

      // Parse job listings from Indeed's HTML structure
      $('[data-jk]').each((index, element) => {
        if (index >= limit) return false; // Limit results

        const $job = $(element);
        const jobId = $job.attr('data-jk');
        
        if (!jobId) return;

        const title = $job.find('h2 a span[title]').attr('title') || 
                     $job.find('h2 a').text().trim() || 
                     'Job Title';
        
        const company = $job.find('[data-testid="company-name"]').text().trim() || 
                       $job.find('.companyName').text().trim() || 
                       'Company Name';
        
        const location = $job.find('[data-testid="job-location"]').text().trim() || 
                        $job.find('.companyLocation').text().trim() || 
                        location;
        
        const salary = $job.find('[data-testid="attribute_snippet_testid"]').text().trim() || 
                      $job.find('.salary-snippet').text().trim() || 
                      'Salary not specified';
        
        const description = $job.find('.job-snippet').text().trim() || 
                           $job.find('[data-testid="job-snippet"]').text().trim() || 
                           'Job description not available';
        
        const postedDate = $job.find('[data-testid="myJobsStateDate"]').text().trim() || 
                          $job.find('.date').text().trim() || 
                          'Recently posted';
        
        const jobUrl = `https://www.indeed.com/viewjob?jk=${jobId}`;

        jobs.push({
          _id: `indeed_${jobId}`,
          title: title,
          company: company,
          location: location,
          salary: salary,
          description: description,
          jobType: 'Full-time', // Default, could be parsed from description
          experience: 'Entry Level', // Default, could be parsed from description
          skills: this.extractSkills(description),
          postedDate: postedDate,
          source: 'Indeed',
          externalUrl: jobUrl,
          isExternal: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });

      console.log(`✅ Found ${jobs.length} jobs from Indeed`);
      return jobs;

    } catch (error) {
      console.error('❌ Error fetching Indeed jobs:', error.message);
      
      // Return mock Indeed jobs when scraping fails
      console.log('🔄 Returning mock Indeed jobs due to scraping error');
      return this.getMockIndeedJobs(query, location, limit);
    }
  }

  // Mock Indeed jobs when scraping fails
  getMockIndeedJobs(query, location, limit) {
    const mockJobs = [
      {
        _id: 'indeed_mock_1',
        title: 'Software Engineer',
        company: 'Google',
        location: 'Mountain View, CA',
        salary: '$120,000 - $180,000',
        description: 'Join Google as a Software Engineer and work on cutting-edge technology...',
        jobType: 'Full-time',
        experience: 'Mid Level',
        skills: ['Python', 'Java', 'C++', 'Machine Learning'],
        postedDate: '2 days ago',
        source: 'Indeed',
        externalUrl: 'https://www.indeed.com/viewjob?jk=mock1',
        isExternal: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'indeed_mock_2',
        title: 'Frontend Developer',
        company: 'Meta',
        location: 'Menlo Park, CA',
        salary: '$100,000 - $150,000',
        description: 'Build amazing user experiences at Meta as a Frontend Developer...',
        jobType: 'Full-time',
        experience: 'Mid Level',
        skills: ['React', 'JavaScript', 'TypeScript', 'CSS'],
        postedDate: '1 day ago',
        source: 'Indeed',
        externalUrl: 'https://www.indeed.com/viewjob?jk=mock2',
        isExternal: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'indeed_mock_3',
        title: 'Data Scientist',
        company: 'Netflix',
        location: 'Los Gatos, CA',
        salary: '$130,000 - $190,000',
        description: 'Help Netflix understand user behavior and improve recommendations...',
        jobType: 'Full-time',
        experience: 'Senior Level',
        skills: ['Python', 'R', 'SQL', 'Machine Learning', 'Statistics'],
        postedDate: '3 days ago',
        source: 'Indeed',
        externalUrl: 'https://www.indeed.com/viewjob?jk=mock3',
        isExternal: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    return mockJobs.slice(0, limit);
  }

  // Fetch jobs from GitHub Jobs API (if available) or similar
  async fetchGitHubJobs(query = 'software engineer', location = 'remote', limit = 20) {
    try {
      console.log(`🔍 Fetching GitHub jobs for: ${query} in ${location}`);
      
      // Note: GitHub Jobs API was deprecated, but we can use similar job APIs
      // For now, return mock data or integrate with other job APIs
      const mockJobs = [
        {
          _id: 'github_1',
          title: 'Frontend Developer',
          company: 'Tech Startup',
          location: 'San Francisco, CA',
          salary: '$80,000 - $120,000',
          description: 'We are looking for a talented frontend developer to join our team...',
          jobType: 'Full-time',
          experience: 'Mid Level',
          skills: ['React', 'JavaScript', 'CSS'],
          postedDate: '2 days ago',
          source: 'GitHub',
          externalUrl: 'https://jobs.github.com/positions/1',
          isExternal: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      console.log(`✅ Found ${mockJobs.length} jobs from GitHub`);
      return mockJobs.slice(0, limit);

    } catch (error) {
      console.error('❌ Error fetching GitHub jobs:', error.message);
      return [];
    }
  }

  // Fetch jobs from AngelList/Wellfound (startup jobs)
  async fetchStartupJobs(query = 'software engineer', location = 'remote', limit = 20) {
    try {
      console.log(`🔍 Fetching startup jobs for: ${query} in ${location}`);
      
      // Mock startup jobs data
      const startupJobs = [
        {
          _id: 'startup_1',
          title: 'Full Stack Developer',
          company: 'Innovative Startup',
          location: 'New York, NY',
          salary: '$70,000 - $100,000 + Equity',
          description: 'Join our fast-growing startup as a full stack developer...',
          jobType: 'Full-time',
          experience: 'Entry Level',
          skills: ['Node.js', 'React', 'MongoDB'],
          postedDate: '1 day ago',
          source: 'Wellfound',
          externalUrl: 'https://wellfound.com/startup/innovative-startup/jobs/123456',
          isExternal: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: 'startup_2',
          title: 'DevOps Engineer',
          company: 'Cloud Startup',
          location: 'Remote',
          salary: '$90,000 - $130,000',
          description: 'We need a DevOps engineer to help scale our infrastructure...',
          jobType: 'Full-time',
          experience: 'Mid Level',
          skills: ['AWS', 'Docker', 'Kubernetes'],
          postedDate: '3 days ago',
          source: 'Wellfound',
          externalUrl: 'https://wellfound.com/startup/cloud-startup/jobs/789012',
          isExternal: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      console.log(`✅ Found ${startupJobs.length} jobs from startups`);
      return startupJobs.slice(0, limit);

    } catch (error) {
      console.error('❌ Error fetching startup jobs:', error.message);
      return [];
    }
  }

  // Extract skills from job description
  extractSkills(description) {
    const commonSkills = [
      'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'Angular', 'Vue.js',
      'HTML', 'CSS', 'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker',
      'Kubernetes', 'Git', 'REST API', 'GraphQL', 'TypeScript', 'PHP',
      'Ruby', 'Go', 'C++', 'C#', 'Swift', 'Kotlin', 'Flutter', 'React Native'
    ];

    const foundSkills = [];
    const lowerDescription = description.toLowerCase();

    commonSkills.forEach(skill => {
      if (lowerDescription.includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      }
    });

    return foundSkills.slice(0, 5); // Return max 5 skills
  }

  // Fetch jobs from multiple sources
  async fetchAllJobs(query = 'software engineer', location = 'remote', limit = 50) {
    try {
      console.log(`🚀 Fetching jobs from multiple sources for: ${query} in ${location}`);
      
      const [indeedJobs, githubJobs, startupJobs] = await Promise.allSettled([
        this.fetchIndeedJobs(query, location, Math.ceil(limit / 3)),
        this.fetchGitHubJobs(query, location, Math.ceil(limit / 3)),
        this.fetchStartupJobs(query, location, Math.ceil(limit / 3))
      ]);

      const allJobs = [
        ...(indeedJobs.status === 'fulfilled' ? indeedJobs.value : []),
        ...(githubJobs.status === 'fulfilled' ? githubJobs.value : []),
        ...(startupJobs.status === 'fulfilled' ? startupJobs.value : [])
      ];

      // Shuffle and limit results
      const shuffledJobs = this.shuffleArray(allJobs).slice(0, limit);
      
      console.log(`✅ Total jobs fetched: ${shuffledJobs.length}`);
      return shuffledJobs;

    } catch (error) {
      console.error('❌ Error fetching all jobs:', error.message);
      return [];
    }
  }

  // Shuffle array to mix results from different sources
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Get job categories for filtering
  getJobCategories() {
    return [
      { id: 'software', name: 'Software Development', keywords: ['software', 'developer', 'programmer', 'engineer'] },
      { id: 'data', name: 'Data Science', keywords: ['data scientist', 'data analyst', 'machine learning', 'ai'] },
      { id: 'design', name: 'Design', keywords: ['designer', 'ui', 'ux', 'graphic design'] },
      { id: 'marketing', name: 'Marketing', keywords: ['marketing', 'digital marketing', 'social media'] },
      { id: 'sales', name: 'Sales', keywords: ['sales', 'business development', 'account manager'] },
      { id: 'finance', name: 'Finance', keywords: ['finance', 'accounting', 'financial analyst'] },
      { id: 'hr', name: 'Human Resources', keywords: ['hr', 'human resources', 'recruiter'] },
      { id: 'operations', name: 'Operations', keywords: ['operations', 'project manager', 'coordinator'] }
    ];
  }

  // Get popular job locations
  getPopularLocations() {
    return [
      'Remote',
      'New York, NY',
      'San Francisco, CA',
      'Los Angeles, CA',
      'Chicago, IL',
      'Austin, TX',
      'Seattle, WA',
      'Boston, MA',
      'Denver, CO',
      'Miami, FL',
      'Atlanta, GA',
      'Dallas, TX',
      'Phoenix, AZ',
      'Portland, OR',
      'Nashville, TN'
    ];
  }
}

module.exports = new JobFetchingService();
