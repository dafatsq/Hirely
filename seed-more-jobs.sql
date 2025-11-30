-- ==========================================
-- SEED 40 MORE JOBS FROM 10 MORE COMPANIES
-- ==========================================
-- Run this in Supabase SQL Editor
-- ==========================================

DO $$
DECLARE
  v_company_ids UUID[10];
  v_company_id UUID;
  i INT;
BEGIN

-- Create 10 more companies
INSERT INTO companies (name, description, logo_url, website, verified)
VALUES
  ('CloudTech Systems', 'Enterprise cloud solutions and infrastructure provider', NULL, 'https://cloudtech.example.com', true),
  ('DataFlow Analytics', 'Big data analytics and business intelligence platform', NULL, 'https://dataflow.example.com', true),
  ('MobileFirst Dev', 'Mobile app development and consulting agency', NULL, 'https://mobilefirst.example.com', true),
  ('CyberShield Security', 'Cybersecurity and threat protection services', NULL, 'https://cybershield.example.com', true),
  ('GreenEnergy Solutions', 'Renewable energy and sustainability tech company', NULL, 'https://greenenergy.example.com', false),
  ('HealthTech Innovations', 'Healthcare technology and telemedicine platform', NULL, 'https://healthtech.example.com', true),
  ('EduLearn Platform', 'Online education and e-learning solutions', NULL, 'https://edulearn.example.com', true),
  ('RetailPro Systems', 'Retail management and POS software provider', NULL, 'https://retailpro.example.com', false),
  ('GameDev Studios', 'Video game development and publishing', NULL, 'https://gamedev.example.com', true),
  ('LogiTrack Solutions', 'Logistics and supply chain management software', NULL, 'https://logitrack.example.com', true);

-- Get the IDs of the companies we just created
SELECT ARRAY_AGG(id ORDER BY created_at DESC) INTO v_company_ids 
FROM (SELECT id, created_at FROM companies ORDER BY created_at DESC LIMIT 10) AS recent_companies;

-- CloudTech Systems - 4 jobs
INSERT INTO job_postings (company_id, employer_id, title, description, requirements, location, type, salary_min, salary_max, skills, status)
VALUES
  (v_company_ids[1], NULL, 'Cloud Solutions Architect', 'Design and implement scalable cloud architectures for enterprise clients using AWS, Azure, and GCP.', 'AWS/Azure/GCP certification, 5+ years cloud experience, Infrastructure as Code, Kubernetes knowledge', 'Seattle, WA', 'full-time', 140000, 190000, ARRAY['AWS', 'Azure', 'Kubernetes', 'Terraform', 'Docker'], 'open'),
  (v_company_ids[1], NULL, 'DevOps Engineer', 'Build and maintain CI/CD pipelines, automate infrastructure, and ensure system reliability.', '3+ years DevOps experience, Docker/Kubernetes, Jenkins/GitLab CI, Scripting skills', 'Seattle, WA', 'full-time', 115000, 155000, ARRAY['Docker', 'Kubernetes', 'Jenkins', 'Python', 'Bash'], 'open'),
  (v_company_ids[1], NULL, 'Site Reliability Engineer', 'Monitor and optimize system performance, implement monitoring solutions, and handle incident response.', 'SRE experience, Strong Linux skills, Monitoring tools (Prometheus, Grafana), On-call experience', 'Remote', 'full-time', 125000, 165000, ARRAY['Linux', 'Prometheus', 'Grafana', 'Python', 'Go'], 'open'),
  (v_company_ids[1], NULL, 'Junior Cloud Engineer', 'Support cloud infrastructure projects, assist with deployments, and learn enterprise cloud technologies.', '1-2 years experience, Basic AWS/Azure knowledge, Eager to learn, CS degree or equivalent', 'Seattle, WA', 'full-time', 75000, 95000, ARRAY['AWS', 'Linux', 'Git', 'Python', 'Networking'], 'open');

-- DataFlow Analytics - 4 jobs
INSERT INTO job_postings (company_id, employer_id, title, description, requirements, location, type, salary_min, salary_max, skills, status)
VALUES
  (v_company_ids[2], NULL, 'Senior Data Engineer', 'Build and maintain data pipelines, design data warehouses, and optimize ETL processes.', '5+ years data engineering, Spark/Kafka experience, SQL mastery, Python/Scala proficiency', 'Austin, TX', 'full-time', 135000, 175000, ARRAY['Python', 'Spark', 'Kafka', 'SQL', 'Airflow'], 'open'),
  (v_company_ids[2], NULL, 'Machine Learning Engineer', 'Develop and deploy ML models, work with big data, and build recommendation systems.', 'ML/AI experience, Python/TensorFlow/PyTorch, Model deployment, Big data tools', 'Austin, TX', 'full-time', 145000, 185000, ARRAY['Python', 'TensorFlow', 'PyTorch', 'Spark', 'Kubernetes'], 'open'),
  (v_company_ids[2], NULL, 'Data Scientist', 'Analyze complex datasets, build predictive models, and provide actionable insights to stakeholders.', 'MS/PhD in quantitative field, Python/R, Statistics/ML, Data visualization, Business acumen', 'Remote', 'full-time', 120000, 160000, ARRAY['Python', 'R', 'SQL', 'Tableau', 'Statistics'], 'open'),
  (v_company_ids[2], NULL, 'BI Developer', 'Create dashboards and reports, design data models, and support business intelligence initiatives.', '3+ years BI experience, Tableau/Power BI, SQL expertise, Data modeling skills', 'Austin, TX', 'full-time', 90000, 125000, ARRAY['Tableau', 'Power BI', 'SQL', 'ETL', 'Excel'], 'open');

-- MobileFirst Dev - 4 jobs
INSERT INTO job_postings (company_id, employer_id, title, description, requirements, location, type, salary_min, salary_max, skills, status)
VALUES
  (v_company_ids[3], NULL, 'iOS Developer', 'Build native iOS applications using Swift, implement new features, and maintain app quality.', '3+ years iOS development, Swift expertise, UIKit/SwiftUI, App Store submission experience', 'San Francisco, CA', 'full-time', 130000, 170000, ARRAY['Swift', 'iOS', 'SwiftUI', 'Xcode', 'Git'], 'open'),
  (v_company_ids[3], NULL, 'Android Developer', 'Develop native Android apps with Kotlin, optimize performance, and follow Material Design.', '3+ years Android development, Kotlin proficiency, Jetpack Compose, Google Play experience', 'San Francisco, CA', 'full-time', 125000, 165000, ARRAY['Kotlin', 'Android', 'Jetpack Compose', 'MVVM', 'Git'], 'open'),
  (v_company_ids[3], NULL, 'React Native Developer', 'Build cross-platform mobile apps, maintain shared codebase, and integrate native modules.', '2+ years React Native, JavaScript/TypeScript, Mobile app architecture, CI/CD for mobile', 'Remote', 'full-time', 110000, 145000, ARRAY['React Native', 'JavaScript', 'TypeScript', 'Redux', 'Git'], 'open'),
  (v_company_ids[3], NULL, 'Mobile QA Engineer', 'Test mobile applications across devices, automate testing, and ensure app quality.', 'Mobile testing experience, Automation tools (Appium/XCTest), Bug tracking, Detail-oriented', 'San Francisco, CA', 'full-time', 85000, 115000, ARRAY['Appium', 'XCTest', 'Selenium', 'JIRA', 'Git'], 'open');

-- CyberShield Security - 4 jobs
INSERT INTO job_postings (company_id, employer_id, title, description, requirements, location, type, salary_min, salary_max, skills, status)
VALUES
  (v_company_ids[4], NULL, 'Security Engineer', 'Implement security controls, conduct vulnerability assessments, and respond to security incidents.', '4+ years security experience, Penetration testing, SIEM tools, Security frameworks (NIST, ISO)', 'Washington, DC', 'full-time', 125000, 165000, ARRAY['Penetration Testing', 'SIEM', 'Firewall', 'IDS/IPS', 'Python'], 'open'),
  (v_company_ids[4], NULL, 'SOC Analyst', 'Monitor security events, investigate alerts, and coordinate incident response activities.', '2+ years SOC experience, SIEM platforms, Threat intelligence, Security certifications preferred', 'Washington, DC', 'full-time', 85000, 115000, ARRAY['SIEM', 'Splunk', 'Threat Analysis', 'Incident Response', 'Networking'], 'open'),
  (v_company_ids[4], NULL, 'Application Security Engineer', 'Review code for vulnerabilities, perform security testing, and provide secure coding guidance.', 'AppSec experience, OWASP Top 10, Secure SDLC, Code review skills, Programming knowledge', 'Remote', 'full-time', 130000, 170000, ARRAY['OWASP', 'Burp Suite', 'SAST', 'DAST', 'Python'], 'open'),
  (v_company_ids[4], NULL, 'Compliance Specialist', 'Ensure regulatory compliance, conduct audits, and maintain security documentation.', 'Compliance experience, HIPAA/PCI-DSS/SOC2, Audit coordination, Policy development', 'Washington, DC', 'full-time', 95000, 130000, ARRAY['Compliance', 'Auditing', 'Risk Management', 'Documentation', 'GRC'], 'open');

-- GreenEnergy Solutions - 4 jobs
INSERT INTO job_postings (company_id, employer_id, title, description, requirements, location, type, salary_min, salary_max, skills, status)
VALUES
  (v_company_ids[5], NULL, 'IoT Engineer', 'Develop IoT solutions for renewable energy monitoring and smart grid applications.', 'IoT experience, Embedded systems, MQTT/CoAP protocols, Python/C++, Edge computing', 'Denver, CO', 'full-time', 105000, 140000, ARRAY['IoT', 'Python', 'C++', 'MQTT', 'Embedded Systems'], 'open'),
  (v_company_ids[5], NULL, 'Energy Data Analyst', 'Analyze energy consumption data, optimize energy usage, and create sustainability reports.', 'Data analysis skills, Energy industry knowledge, SQL/Python, Visualization tools, Statistics', 'Denver, CO', 'full-time', 80000, 110000, ARRAY['Python', 'SQL', 'Tableau', 'Excel', 'Statistics'], 'open'),
  (v_company_ids[5], NULL, 'Full Stack Developer', 'Build web applications for energy management, customer portals, and monitoring dashboards.', '3+ years full stack, React/Node.js, REST APIs, Database design, Agile experience', 'Remote', 'full-time', 100000, 135000, ARRAY['React', 'Node.js', 'PostgreSQL', 'TypeScript', 'AWS'], 'open'),
  (v_company_ids[5], NULL, 'Product Manager', 'Define product roadmap for energy tech products, work with stakeholders, and drive innovation.', '5+ years product management, Energy/cleantech domain, Agile methodologies, Stakeholder management', 'Denver, CO', 'full-time', 115000, 155000, ARRAY['Product Management', 'Agile', 'Roadmapping', 'Stakeholder Management', 'Analytics'], 'open');

-- HealthTech Innovations - 4 jobs
INSERT INTO job_postings (company_id, employer_id, title, description, requirements, location, type, salary_min, salary_max, skills, status)
VALUES
  (v_company_ids[6], NULL, 'Healthcare Software Engineer', 'Develop HIPAA-compliant healthcare applications and telemedicine platforms.', '4+ years software development, Healthcare domain knowledge, HIPAA compliance, API development', 'Boston, MA', 'full-time', 120000, 160000, ARRAY['Python', 'React', 'HIPAA', 'HL7/FHIR', 'PostgreSQL'], 'open'),
  (v_company_ids[6], NULL, 'Clinical Data Specialist', 'Manage clinical data, ensure data quality, and support clinical research initiatives.', 'Healthcare data experience, EDC systems, Clinical trial knowledge, SQL skills, Attention to detail', 'Boston, MA', 'full-time', 85000, 115000, ARRAY['Clinical Data', 'EDC', 'SQL', 'Excel', 'GCP'], 'open'),
  (v_company_ids[6], NULL, 'UX Designer - Healthcare', 'Design intuitive healthcare interfaces, conduct user research, and improve patient experience.', '3+ years UX design, Healthcare UX preferred, Figma/Sketch, User research, Accessibility standards', 'Remote', 'full-time', 95000, 130000, ARRAY['Figma', 'UX Research', 'Prototyping', 'Accessibility', 'Healthcare'], 'open'),
  (v_company_ids[6], NULL, 'DevOps Engineer - Healthcare', 'Maintain HIPAA-compliant infrastructure, implement security controls, and ensure high availability.', 'DevOps experience, HIPAA compliance, AWS/Azure, Kubernetes, Security best practices', 'Boston, MA', 'full-time', 115000, 150000, ARRAY['AWS', 'Kubernetes', 'HIPAA', 'Terraform', 'Security'], 'open');

-- EduLearn Platform - 4 jobs
INSERT INTO job_postings (company_id, employer_id, title, description, requirements, location, type, salary_min, salary_max, skills, status)
VALUES
  (v_company_ids[7], NULL, 'Senior Backend Engineer', 'Build scalable backend systems for online learning platform, handle millions of users.', '5+ years backend development, Microservices architecture, Node.js/Python, Database optimization', 'Chicago, IL', 'full-time', 130000, 170000, ARRAY['Node.js', 'Python', 'PostgreSQL', 'Redis', 'Microservices'], 'open'),
  (v_company_ids[7], NULL, 'Frontend Engineer', 'Create responsive web interfaces for educational content delivery and student engagement.', '3+ years frontend, React/Vue.js, Modern CSS, Performance optimization, Accessibility', 'Remote', 'full-time', 110000, 145000, ARRAY['React', 'TypeScript', 'CSS', 'Webpack', 'Accessibility'], 'open'),
  (v_company_ids[7], NULL, 'Learning Technology Specialist', 'Integrate educational tools, support instructors, and optimize learning management system.', 'EdTech experience, LMS platforms (Moodle, Canvas), Technical training, Customer support', 'Chicago, IL', 'full-time', 70000, 95000, ARRAY['LMS', 'EdTech', 'Technical Support', 'Training', 'Documentation'], 'open'),
  (v_company_ids[7], NULL, 'Video Platform Engineer', 'Build and maintain video streaming infrastructure for online courses and live sessions.', 'Video streaming experience, CDN knowledge, FFmpeg/encoding, Real-time systems, Cloud platforms', 'Chicago, IL', 'full-time', 120000, 155000, ARRAY['Video Streaming', 'FFmpeg', 'AWS', 'WebRTC', 'CDN'], 'open');

-- RetailPro Systems - 4 jobs
INSERT INTO job_postings (company_id, employer_id, title, description, requirements, location, type, salary_min, salary_max, skills, status)
VALUES
  (v_company_ids[8], NULL, 'POS Software Developer', 'Develop point-of-sale software, integrate payment systems, and ensure transaction reliability.', '3+ years POS development, Payment gateway integration, C#/.NET, Real-time systems', 'Dallas, TX', 'full-time', 95000, 130000, ARRAY['C#', '.NET', 'SQL Server', 'Payment APIs', 'WPF'], 'open'),
  (v_company_ids[8], NULL, 'Inventory Management Developer', 'Build inventory tracking systems, implement barcode scanning, and optimize stock management.', 'Inventory systems experience, Database design, API development, Retail domain knowledge', 'Dallas, TX', 'full-time', 90000, 120000, ARRAY['Java', 'Spring Boot', 'MySQL', 'REST APIs', 'Barcode'], 'open'),
  (v_company_ids[8], NULL, 'QA Automation Engineer', 'Automate testing for retail software, ensure POS reliability, and perform regression testing.', '2+ years QA automation, Selenium/Cypress, API testing, CI/CD integration, Bug tracking', 'Remote', 'full-time', 80000, 110000, ARRAY['Selenium', 'Cypress', 'Java', 'API Testing', 'Jenkins'], 'open'),
  (v_company_ids[8], NULL, 'Customer Support Engineer', 'Provide technical support for retail clients, troubleshoot issues, and maintain documentation.', 'Technical support experience, SQL knowledge, Problem-solving skills, Customer service oriented', 'Dallas, TX', 'full-time', 60000, 85000, ARRAY['Technical Support', 'SQL', 'Troubleshooting', 'Documentation', 'Customer Service'], 'open');

-- GameDev Studios - 4 jobs
INSERT INTO job_postings (company_id, employer_id, title, description, requirements, location, type, salary_min, salary_max, skills, status)
VALUES
  (v_company_ids[9], NULL, 'Unity Game Developer', 'Develop games using Unity engine, implement gameplay mechanics, and optimize performance.', '3+ years Unity development, C# expertise, 3D math knowledge, Multiplayer experience preferred', 'Los Angeles, CA', 'full-time', 100000, 140000, ARRAY['Unity', 'C#', '3D Graphics', 'Game Design', 'Multiplayer'], 'open'),
  (v_company_ids[9], NULL, 'Graphics Programmer', 'Implement advanced rendering techniques, optimize shaders, and enhance visual quality.', 'Graphics programming experience, HLSL/GLSL, Unity/Unreal, Math/physics knowledge, GPU optimization', 'Los Angeles, CA', 'full-time', 120000, 160000, ARRAY['C++', 'HLSL', 'OpenGL', 'Vulkan', 'Graphics'], 'open'),
  (v_company_ids[9], NULL, 'Game Designer', 'Design game mechanics, balance gameplay, create level designs, and document game systems.', '2+ years game design, Portfolio required, Understanding of game theory, Prototyping skills', 'Los Angeles, CA', 'full-time', 80000, 110000, ARRAY['Game Design', 'Unity', 'Level Design', 'Balancing', 'Documentation'], 'open'),
  (v_company_ids[9], NULL, 'Backend Engineer - Gaming', 'Build game servers, implement matchmaking, manage player data, and ensure low latency.', '3+ years backend development, Real-time systems, Database scaling, Networking, Cloud platforms', 'Remote', 'full-time', 110000, 145000, ARRAY['Node.js', 'WebSocket', 'Redis', 'MongoDB', 'AWS'], 'open');

-- LogiTrack Solutions - 4 jobs
INSERT INTO job_postings (company_id, employer_id, title, description, requirements, location, type, salary_min, salary_max, skills, status)
VALUES
  (v_company_ids[10], NULL, 'Logistics Software Engineer', 'Develop route optimization algorithms, tracking systems, and warehouse management features.', '4+ years software development, Algorithm design, Database design, API development, Logistics domain', 'Atlanta, GA', 'full-time', 105000, 140000, ARRAY['Python', 'Java', 'PostgreSQL', 'Algorithms', 'REST APIs'], 'open'),
  (v_company_ids[10], NULL, 'Mobile Developer - Logistics', 'Build mobile apps for drivers and warehouse staff, implement offline capabilities and GPS tracking.', '3+ years mobile development, React Native or native, Offline-first apps, GPS/mapping, Push notifications', 'Atlanta, GA', 'full-time', 100000, 135000, ARRAY['React Native', 'iOS', 'Android', 'GPS', 'Offline Apps'], 'open'),
  (v_company_ids[10], NULL, 'Data Engineer - Supply Chain', 'Build data pipelines for logistics data, create analytics dashboards, and optimize data flow.', '3+ years data engineering, ETL processes, SQL expertise, Real-time data processing, BI tools', 'Remote', 'full-time', 110000, 145000, ARRAY['Python', 'SQL', 'Airflow', 'Kafka', 'Tableau'], 'open'),
  (v_company_ids[10], NULL, 'Integration Specialist', 'Integrate with third-party logistics APIs, build connectors, and maintain data synchronization.', '2+ years integration experience, API development, EDI knowledge, Problem-solving skills, Documentation', 'Atlanta, GA', 'full-time', 85000, 115000, ARRAY['REST APIs', 'EDI', 'XML/JSON', 'Integration', 'Documentation'], 'open');

RAISE NOTICE 'Successfully added 10 companies and 40 jobs!';

END $$;
