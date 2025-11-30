-- Create skills table
CREATE TABLE IF NOT EXISTS skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone
CREATE POLICY "Allow public read access" ON skills
  FOR SELECT USING (true);

-- Allow authenticated users to insert new skills
CREATE POLICY "Allow authenticated insert" ON skills
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Seed initial skills
INSERT INTO skills (name) VALUES
  -- Frontend
  ('React'), ('Vue.js'), ('Angular'), ('Svelte'), ('Next.js'), ('Nuxt.js'), ('Remix'),
  ('TypeScript'), ('JavaScript'), ('HTML'), ('CSS'), ('Sass'), ('Less'), ('Tailwind CSS'),
  ('Bootstrap'), ('Material UI'), ('Chakra UI'), ('Redux'), ('MobX'), ('Zustand'),
  ('Webpack'), ('Vite'), ('Rollup'), ('Babel'), ('jQuery'), ('Three.js'), ('D3.js'),

  -- Backend
  ('Node.js'), ('Express.js'), ('NestJS'), ('Python'), ('Django'), ('Flask'), ('FastAPI'),
  ('Java'), ('Spring Boot'), ('Hibernate'), ('C#'), ('.NET'), ('ASP.NET Core'),
  ('PHP'), ('Laravel'), ('Symfony'), ('Ruby'), ('Ruby on Rails'), ('Go'), ('Golang'),
  ('Rust'), ('Scala'), ('Elixir'), ('C++'), ('C'), ('Perl'), ('Lua'),

  -- Mobile
  ('React Native'), ('Flutter'), ('Dart'), ('Swift'), ('SwiftUI'), ('Objective-C'),
  ('Kotlin'), ('Android Development'), ('iOS Development'), ('Xamarin'), ('Ionic'),

  -- Database
  ('PostgreSQL'), ('MySQL'), ('SQLite'), ('MariaDB'), ('Oracle SQL'), ('Microsoft SQL Server'),
  ('MongoDB'), ('Redis'), ('Cassandra'), ('DynamoDB'), ('Firebase'), ('Supabase'),
  ('Elasticsearch'), ('Neo4j'), ('CouchDB'), ('Prisma'), ('TypeORM'), ('Sequelize'),

  -- DevOps & Cloud
  ('AWS'), ('Amazon Web Services'), ('Google Cloud Platform'), ('GCP'), ('Microsoft Azure'),
  ('Docker'), ('Kubernetes'), ('Terraform'), ('Ansible'), ('Jenkins'), ('GitLab CI'),
  ('GitHub Actions'), ('CircleCI'), ('Travis CI'), ('Linux'), ('Unix'), ('Bash'),
  ('Shell Scripting'), ('Nginx'), ('Apache'), ('Heroku'), ('Vercel'), ('Netlify'),
  ('DigitalOcean'), ('Serverless'), ('Microservices'),

  -- Data Science & AI
  ('Machine Learning'), ('Deep Learning'), ('Artificial Intelligence'), ('Data Science'),
  ('Data Analysis'), ('TensorFlow'), ('PyTorch'), ('Keras'), ('Scikit-learn'),
  ('Pandas'), ('NumPy'), ('Matplotlib'), ('Seaborn'), ('R'), ('Julia'), ('Hadoop'),
  ('Spark'), ('Big Data'), ('Computer Vision'), ('NLP'), ('Natural Language Processing'),
  ('OpenAI API'), ('LangChain'),

  -- Tools & Testing
  ('Git'), ('GitHub'), ('GitLab'), ('Bitbucket'), ('Jira'), ('Trello'), ('Asana'),
  ('Notion'), ('Slack'), ('Discord'), ('Zoom'), ('Microsoft Teams'), ('VS Code'),
  ('IntelliJ IDEA'), ('Postman'), ('Insomnia'), ('Swagger'), ('Jest'), ('Mocha'),
  ('Chai'), ('Cypress'), ('Playwright'), ('Selenium'), ('JUnit'), ('PyTest'),

  -- Design
  ('Figma'), ('Adobe XD'), ('Sketch'), ('InVision'), ('Photoshop'), ('Illustrator'),
  ('After Effects'), ('Premiere Pro'), ('UI Design'), ('UX Design'), ('Prototyping'),
  ('Wireframing'), ('User Research'), ('Canva'),

  -- Soft Skills
  ('Communication'), ('Teamwork'), ('Leadership'), ('Problem Solving'), ('Critical Thinking'),
  ('Time Management'), ('Adaptability'), ('Creativity'), ('Emotional Intelligence'),
  ('Conflict Resolution'), ('Mentoring'), ('Public Speaking'), ('Presentation Skills'),
  ('Negotiation'), ('Decision Making'), ('Attention to Detail'), ('Work Ethic'),
  ('Collaboration'), ('Remote Work'), ('Self-motivation')
ON CONFLICT (name) DO NOTHING;
