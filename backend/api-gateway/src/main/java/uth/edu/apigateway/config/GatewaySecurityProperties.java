package uth.edu.apigateway.config;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "gateway.security")
public class GatewaySecurityProperties {

    private List<String> publicPaths = new ArrayList<>();
    private List<String> protectedPaths = new ArrayList<>();
    private Map<String, List<String>> roleRules = new HashMap<>();

    public List<String> getPublicPaths() {
        return publicPaths;
    }

    public void setPublicPaths(List<String> publicPaths) {
        this.publicPaths = publicPaths;
    }

    public List<String> getProtectedPaths() {
        return protectedPaths;
    }

    public void setProtectedPaths(List<String> protectedPaths) {
        this.protectedPaths = protectedPaths;
    }

    public Map<String, List<String>> getRoleRules() {
        return roleRules;
    }

    public void setRoleRules(Map<String, List<String>> roleRules) {
        this.roleRules = roleRules;
    }
}
