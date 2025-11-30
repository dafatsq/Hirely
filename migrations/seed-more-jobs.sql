-- Clean up existing data
TRUNCATE TABLE job_postings CASCADE;
TRUNCATE TABLE companies CASCADE;

-- Temporarily disable the trigger that enforces employer-company match
-- This allows us to seed jobs for multiple companies using a single user account
ALTER TABLE job_postings DISABLE TRIGGER enforce_employer_company_match;

-- Helper block to seed companies and then jobs
DO $$
DECLARE
  owner_id UUID;
BEGIN
  -- 1. Get a valid user ID to own the companies (Employer)
  -- We try to find a user with role 'employer', or fallback to any user
  SELECT id INTO owner_id FROM auth.users LIMIT 1;
  
  -- If no user exists, we can't proceed with foreign keys usually. 
  -- But assuming this is a dev env with at least one user.
  IF owner_id IS NULL THEN
    RAISE NOTICE 'No users found in auth.users. Cannot seed companies.';
    RETURN;
  END IF;

  -- 2. Insert 20 Companies
  INSERT INTO companies (name, description, industry, location, company_size, website, created_by)
  VALUES
    ('TechNova', 'Innovating the future of AI and Machine Learning.', 'Technology', 'San Francisco, CA', '100-500', 'https://technova.io', owner_id),
    ('GreenEarth Energy', 'Sustainable energy solutions for a cleaner planet.', 'Energy', 'Austin, TX', '500-1000', 'https://greenearth.com', owner_id),
    ('Quantum Finance', 'Next-generation algorithmic trading platforms.', 'Finance', 'New York, NY', '50-100', 'https://quantumfin.com', owner_id),
    ('HealthPlus', 'Digital healthcare and telemedicine services.', 'Healthcare', 'Boston, MA', '200-500', 'https://healthplus.co', owner_id),
    ('EduLearn', 'Democratizing education through online learning.', 'Education', 'Remote', '10-50', 'https://edulearn.org', owner_id),
    ('CyberShield', 'Enterprise-grade cybersecurity protection.', 'Security', 'Washington, DC', '100-500', 'https://cybershield.net', owner_id),
    ('CloudScale', 'Scalable cloud infrastructure and DevOps.', 'Technology', 'Seattle, WA', '1000+', 'https://cloudscale.io', owner_id),
    ('DataFlow Analytics', 'Turning big data into actionable insights.', 'Data', 'Chicago, IL', '50-100', 'https://dataflow.ai', owner_id),
    ('Creative Minds', 'Award-winning digital design agency.', 'Design', 'Los Angeles, CA', '10-50', 'https://creativeminds.agency', owner_id),
    ('AutoDrive', 'Pioneering autonomous vehicle technology.', 'Automotive', 'Detroit, MI', '500-1000', 'https://autodrive.tech', owner_id),
    ('Foodie Express', 'Fast and fresh food delivery network.', 'Consumer', 'New York, NY', '100-500', 'https://foodie.express', owner_id),
    ('TravelWise', 'AI-powered travel planning and booking.', 'Travel', 'Remote', '10-50', 'https://travelwise.com', owner_id),
    ('GameVerse', 'Creating immersive next-gen gaming experiences.', 'Gaming', 'Los Angeles, CA', '50-100', 'https://gameverse.studio', owner_id),
    ('BioLife', 'Biotech research for a healthier tomorrow.', 'Biotech', 'San Diego, CA', '100-500', 'https://biolife.med', owner_id),
    ('RetailConnect', 'Omnichannel e-commerce solutions.', 'Retail', 'Seattle, WA', '200-500', 'https://retailconnect.com', owner_id),
    ('SpaceXplore', 'Commercial space travel and logistics.', 'Aerospace', 'Houston, TX', '1000+', 'https://spacexplore.space', owner_id),
    ('LegalTech', 'Automating legal workflows with AI.', 'Legal', 'Chicago, IL', '10-50', 'https://legaltech.ai', owner_id),
    ('AgriSmart', 'Smart farming and IoT solutions.', 'Agriculture', 'Denver, CO', '50-100', 'https://agrismart.io', owner_id),
    ('MediaStream', 'Global video streaming platform.', 'Media', 'New York, NY', '100-500', 'https://mediastream.tv', owner_id),
    ('ConstructCo', 'Modernizing construction management.', 'Construction', 'Austin, TX', '50-100', 'https://constructco.build', owner_id);

  -- 3. Insert 100 Job Postings
  -- We generate 100 jobs by cross-joining a list of ~40 roles with a multiplier, 
  -- then assigning them round-robin to the 20 companies.
  INSERT INTO job_postings (
    company_id,
    employer_id,
    title,
    description,
    requirements,
    location,
    type,
    salary_min,
    salary_max,
    skills,
    status,
    created_at
  )
  SELECT
    c.id,
    c.created_by,
    j.title,
    j.description,
    j.requirements,
    j.location,
    j.type,
    j.salary_min,
    j.salary_max,
    j.skills,
    'open',
    NOW() - (random() * interval '30 days')
  FROM (
    SELECT 
      title, description, requirements, location, type, salary_min, salary_max, skills,
      row_number() OVER () as rn
    FROM (
      VALUES
        -- Frontend
        ('Senior React Developer', 'Lead frontend development using React and Next.js.', '5+ years exp, React, TypeScript.', 'Remote', 'full-time', 120000, 160000, ARRAY['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Redux']),
        ('Frontend Engineer', 'Build beautiful UIs.', '3+ years JS exp.', 'New York, NY', 'full-time', 90000, 130000, ARRAY['JavaScript', 'Vue.js', 'CSS', 'HTML', 'Git']),
        ('UI/UX Developer', 'Bridge design and code.', 'Design + Code skills.', 'San Francisco, CA', 'full-time', 100000, 140000, ARRAY['Figma', 'React', 'CSS', 'UI Design', 'Prototyping']),
        ('Junior Web Developer', 'Start your career here.', 'Basic web skills.', 'Austin, TX', 'full-time', 60000, 80000, ARRAY['HTML', 'CSS', 'JavaScript', 'Git']),
        ('Angular Specialist', 'Maintain Angular apps.', 'Angular expert.', 'Chicago, IL', 'contract', 110000, 150000, ARRAY['Angular', 'TypeScript', 'RxJS', 'Sass']),
        
        -- Backend
        ('Backend Engineer (Node.js)', 'Build scalable APIs.', 'Node.js expert.', 'Remote', 'full-time', 110000, 150000, ARRAY['Node.js', 'Express.js', 'PostgreSQL', 'Redis', 'Docker']),
        ('Python Developer', 'Data processing backend.', 'Python & SQL.', 'Boston, MA', 'full-time', 100000, 140000, ARRAY['Python', 'Django', 'PostgreSQL', 'AWS', 'Celery']),
        ('Java Architect', 'Enterprise system design.', 'Java veteran.', 'Seattle, WA', 'full-time', 160000, 200000, ARRAY['Java', 'Spring Boot', 'Microservices', 'Kubernetes', 'Kafka']),
        ('Go Developer', 'High performance services.', 'Go & Concurrency.', 'Remote', 'full-time', 130000, 170000, ARRAY['Go', 'Golang', 'gRPC', 'Docker', 'Kubernetes']),
        ('Ruby on Rails Developer', 'Rapid product development.', 'Rails expert.', 'Portland, OR', 'full-time', 100000, 130000, ARRAY['Ruby', 'Ruby on Rails', 'PostgreSQL', 'Redis', 'Sidekiq']),

        -- Full Stack
        ('Full Stack Engineer', 'End-to-end feature ownership.', 'React + Node.', 'Denver, CO', 'full-time', 115000, 155000, ARRAY['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS']),
        ('Lead Software Engineer', 'Tech lead role.', 'Leadership + Code.', 'Remote', 'full-time', 150000, 190000, ARRAY['React', 'Python', 'System Design', 'Leadership', 'Mentoring']),
        ('MERN Stack Developer', 'Modern web apps.', 'Mongo, Express, React, Node.', 'Los Angeles, CA', 'full-time', 95000, 135000, ARRAY['MongoDB', 'Express.js', 'React', 'Node.js', 'JavaScript']),
        ('Software Developer', 'Generalist role.', 'C# or Java.', 'Toronto, ON', 'full-time', 85000, 115000, ARRAY['C#', '.NET', 'SQL Server', 'JavaScript', 'Azure']),
        ('Technical Lead', 'Architecture & Guidance.', 'Full stack + Cloud.', 'London, UK', 'full-time', 140000, 180000, ARRAY['Java', 'React', 'AWS', 'Microservices', 'Agile']),

        -- Mobile
        ('iOS Developer', 'Native iOS apps.', 'Swift expert.', 'Cupertino, CA', 'full-time', 130000, 170000, ARRAY['Swift', 'SwiftUI', 'iOS Development', 'Xcode', 'Git']),
        ('Android Developer', 'Native Android apps.', 'Kotlin expert.', 'Mountain View, CA', 'full-time', 125000, 165000, ARRAY['Kotlin', 'Android Development', 'Java', 'Gradle', 'Firebase']),
        ('React Native Developer', 'Cross-platform mobile.', 'RN expert.', 'Remote', 'contract', 100000, 140000, ARRAY['React Native', 'TypeScript', 'Redux', 'Mobile Development']),
        ('Flutter Engineer', 'Beautiful mobile apps.', 'Dart & Flutter.', 'Berlin, DE', 'full-time', 90000, 120000, ARRAY['Flutter', 'Dart', 'Firebase', 'Mobile Development']),
        ('Mobile Architect', 'Mobile strategy.', 'iOS + Android.', 'Remote', 'full-time', 160000, 200000, ARRAY['iOS Development', 'Android Development', 'System Design', 'Leadership']),

        -- DevOps
        ('DevOps Engineer', 'CI/CD & Infra.', 'AWS & Terraform.', 'Remote', 'full-time', 120000, 160000, ARRAY['AWS', 'Terraform', 'Docker', 'Kubernetes', 'Jenkins']),
        ('SRE', 'Reliability & Uptime.', 'Linux & Go.', 'New York, NY', 'full-time', 140000, 180000, ARRAY['Linux', 'Python', 'Go', 'Prometheus', 'Grafana']),
        ('Cloud Architect', 'Cloud design.', 'AWS/Azure.', 'Seattle, WA', 'full-time', 150000, 190000, ARRAY['AWS', 'Azure', 'Cloud Architecture', 'Security', 'Networking']),
        ('Platform Engineer', 'Internal platforms.', 'K8s & Go.', 'San Francisco, CA', 'full-time', 145000, 185000, ARRAY['Kubernetes', 'Go', 'Docker', 'Helm', 'ArgoCD']),
        ('SysAdmin', 'IT & Servers.', 'Linux/Windows.', 'Chicago, IL', 'full-time', 80000, 110000, ARRAY['Linux', 'Windows Server', 'Bash', 'Networking', 'Security']),

        -- Data
        ('Data Scientist', 'Insights from data.', 'Python & Stats.', 'Boston, MA', 'full-time', 130000, 170000, ARRAY['Python', 'Pandas', 'Scikit-learn', 'SQL', 'Machine Learning']),
        ('ML Engineer', 'Production ML.', 'TensorFlow/PyTorch.', 'Remote', 'full-time', 140000, 180000, ARRAY['Python', 'TensorFlow', 'PyTorch', 'Docker', 'Kubernetes']),
        ('Data Engineer', 'Pipelines & ETL.', 'Spark & SQL.', 'New York, NY', 'full-time', 125000, 165000, ARRAY['Python', 'SQL', 'Spark', 'Airflow', 'Snowflake']),
        ('AI Researcher', 'Deep Learning R&D.', 'PhD level.', 'San Francisco, CA', 'full-time', 180000, 250000, ARRAY['Deep Learning', 'PyTorch', 'Research', 'Mathematics', 'Python']),
        ('Data Analyst', 'Reporting & Dashboards.', 'SQL & Tableau.', 'Austin, TX', 'full-time', 75000, 100000, ARRAY['SQL', 'Tableau', 'Excel', 'Data Analysis', 'Python']),

        -- QA
        ('QA Engineer', 'Manual & Auto testing.', 'Selenium/Cypress.', 'Remote', 'full-time', 80000, 110000, ARRAY['Selenium', 'Cypress', 'JavaScript', 'QA', 'Jira']),
        ('SDET', 'Test automation.', 'Java/Python.', 'Seattle, WA', 'full-time', 110000, 140000, ARRAY['Java', 'Selenium', 'TestNG', 'Jenkins', 'Docker']),
        ('Manual Tester', 'Bug hunting.', 'Detail oriented.', 'Miami, FL', 'contract', 50000, 70000, ARRAY['QA', 'Jira', 'Testing', 'Communication']),
        
        -- Product
        ('Product Manager', 'Product strategy.', 'Agile/Scrum.', 'New York, NY', 'full-time', 130000, 170000, ARRAY['Product Management', 'Agile', 'Jira', 'Communication', 'Strategy']),
        ('Product Designer', 'UX/UI Design.', 'Figma.', 'San Francisco, CA', 'full-time', 110000, 150000, ARRAY['Figma', 'Sketch', 'UI Design', 'UX Design', 'Prototyping']),
        ('Scrum Master', 'Agile process.', 'CSM.', 'Remote', 'full-time', 90000, 120000, ARRAY['Scrum', 'Agile', 'Jira', 'Kanban', 'Coaching']),
        
        -- Security
        ('Security Engineer', 'App & Infra security.', 'Pen testing.', 'Washington, DC', 'full-time', 130000, 170000, ARRAY['Security', 'Penetration Testing', 'Python', 'Linux', 'Networking']),
        ('Cyber Analyst', 'SOC & Monitoring.', 'SIEM.', 'Remote', 'full-time', 90000, 120000, ARRAY['Security', 'SIEM', 'Incident Response', 'Networking']),

        -- Emerging
        ('Blockchain Dev', 'Smart Contracts.', 'Solidity.', 'Remote', 'contract', 140000, 200000, ARRAY['Solidity', 'Ethereum', 'Web3.js', 'Smart Contracts', 'Blockchain']),
        ('Game Dev', 'Unity/Unreal.', 'C#/C++.', 'Los Angeles, CA', 'full-time', 100000, 140000, ARRAY['Unity', 'C#', 'Game Development', '3D Math', 'C++']),
        ('Embedded Eng', 'Firmware.', 'C/C++.', 'Detroit, MI', 'full-time', 110000, 150000, ARRAY['C', 'C++', 'Embedded Systems', 'RTOS', 'Electronics'])
    ) AS t(title, description, requirements, location, type, salary_min, salary_max, skills)
    CROSS JOIN generate_series(1, 3) -- Multiply to get enough rows
    LIMIT 100
  ) j
  JOIN (
    SELECT id, created_by, row_number() OVER (ORDER BY name) as rn 
    FROM companies
  ) c ON ((j.rn - 1) % 20) + 1 = c.rn; -- Distribute jobs evenly across 20 companies

  -- 4. Update the owner to belong to the first company so they can at least manage one
  UPDATE users SET company_id = (SELECT id FROM companies LIMIT 1) WHERE id = owner_id;

END $$;

-- Re-enable the trigger
ALTER TABLE job_postings ENABLE TRIGGER enforce_employer_company_match;
