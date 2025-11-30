import java.util.Date;

public class Application {
    private String id;
    private JobSeeker applicant;
    private JobPosting job;
    private String status;
    private Date appliedDate;

    public Application(String id, JobSeeker applicant, JobPosting job) {
        this.id = id;
        this.applicant = applicant;
        this.job = job;
        this.status = "PENDING";
        this.appliedDate = new Date();
    }

    public void updateStatus(String status) {
        this.status = status;
        System.out.println("Application status updated to: " + status);
    }

    public String getStatus() {
        return status;
    }

    public String getSummary() {
        return applicant.getFullName() + " for " + job.getTitle();
    }
}
