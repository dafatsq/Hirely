import java.util.UUID;

public class HirelySystemDemo {
    public static void main(String[] args) {
        System.out.println("=== Hirely System Demo ===\n");

        // 1. Create an Employer
        Employer techCorp = new Employer(
            UUID.randomUUID().toString(), 
            "hr@techcorp.com", 
            "securepass", 
            "Alice HR", 
            "TechCorp Inc."
        );
        System.out.println("Created Employer: " + techCorp.getFullName() + " from " + techCorp.getCompanyName());

        // 2. Employer posts a job
        JobPosting softwareJob = techCorp.postJob(
            "Senior Java Developer", 
            "Build scalable backend systems.", 
            120000.00
        );

        // 3. Create a Job Seeker
        JobSeeker janeDoe = new JobSeeker(
            UUID.randomUUID().toString(), 
            "jane@example.com", 
            "password123", 
            "Jane Doe"
        );
        janeDoe.addSkill("Java");
        janeDoe.addSkill("Spring Boot");
        janeDoe.uploadResume("https://linkedin.com/in/janedoe/resume.pdf");
        System.out.println("\nCreated Job Seeker: " + janeDoe.getFullName());

        // 4. Job Seeker applies to the job
        System.out.println("\n--- Application Process ---");
        Application app = janeDoe.applyToJob(softwareJob);

        // 5. Employer reviews the application
        System.out.println("\n--- Review Process ---");
        techCorp.reviewApplication(app, "INTERVIEW_SCHEDULED");

        // 6. Check final status
        System.out.println("\nFinal Application Status: " + app.getStatus());
    }
}
