import java.util.ArrayList;
import java.util.List;

public class JobPosting {
    private String id;
    private String title;
    private String description;
    private double salary;
    private Employer employer;
    private List<Application> applications;
    private String status;

    public JobPosting(String id, String title, String description, double salary, Employer employer) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.salary = salary;
        this.employer = employer;
        this.applications = new ArrayList<>();
        this.status = "OPEN";
    }

    public void addApplication(Application app) {
        this.applications.add(app);
    }

    public List<Application> getApplications() {
        return applications;
    }

    public String getDetails() {
        return title + " at " + employer.getCompanyName() + " ($" + salary + ")";
    }
    
    public String getTitle() {
        return title;
    }
}
