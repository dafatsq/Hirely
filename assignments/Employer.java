import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class Employer extends User {
    private String companyName;
    private List<JobPosting> postedJobs;

    public Employer(String id, String email, String password, String fullName, String companyName) {
        super(id, email, password, fullName);
        this.companyName = companyName;
        this.postedJobs = new ArrayList<>();
    }

    public JobPosting postJob(String title, String description, double salary) {
        String jobId = UUID.randomUUID().toString();
        JobPosting newJob = new JobPosting(jobId, title, description, salary, this);
        this.postedJobs.add(newJob);
        System.out.println(this.companyName + " posted a new job: " + title);
        return newJob;
    }

    public void reviewApplication(Application app, String status) {
        System.out.println("Employer " + this.fullName + " is reviewing application from " + app.getSummary());
        app.updateStatus(status);
    }

    public List<JobPosting> getPostedJobs() {
        return postedJobs;
    }
    
    public String getCompanyName() {
        return companyName;
    }
}
