import java.util.UUID;

public abstract class User {
    protected String id;
    protected String email;
    protected String password;
    protected String fullName;

    public User(String id, String email, String password, String fullName) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.fullName = fullName;
    }

    public boolean login(String email, String password) {
        return this.email.equals(email) && this.password.equals(password);
    }

    public void logout() {
        System.out.println("User " + fullName + " logged out.");
    }

    public String getFullName() {
        return fullName;
    }

    public String getEmail() {
        return email;
    }
    
    public String getId() {
        return id;
    }
}
