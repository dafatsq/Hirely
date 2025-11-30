import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class JobSeeker extends User {
    private String resumeUrl;
    private List<String> skills;

    public JobSeeker(String id, String email, String password, String fullName) {
        super(id, email, password, fullName);
        this.skills = new ArrayList<>();
    }

    public void uploadResume(String url) {
        this.resumeUrl = url;
        System.out.println(this.fullName + " uploaded resume: " + url);
    }

    public void addSkill(String skill) {
        this.skills.add(skill);
    }

    public Application applyToJob(JobPosting job) {
        String appId = UUID.randomUUID().toString();
        Application application = new Application(appId, this, job);
        job.addApplication(application);
        System.out.println(this.fullName + " applied to job: " + job.getDetails());
        return application;
    }

    public List<String> getSkills() {
        return skills;
    }
}
