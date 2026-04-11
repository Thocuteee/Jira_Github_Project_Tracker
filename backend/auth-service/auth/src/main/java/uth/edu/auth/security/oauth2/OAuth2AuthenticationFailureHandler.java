package uth.edu.auth.security.oauth2;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class OAuth2AuthenticationFailureHandler extends SimpleUrlAuthenticationFailureHandler {

    @Value("${app.oauth2.redirectUri:http://localhost:5173/oauth2/redirect}")
    private String oauth2RedirectBaseUrl;

    @Override
    public void onAuthenticationFailure(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException exception
    ) throws IOException {
        String redirectBase = normalizeRedirectBaseUrl(request, oauth2RedirectBaseUrl);
        String error = exception == null ? "oauth2_error" : exception.getClass().getSimpleName();
        String message = exception == null ? "" : exception.getMessage();

        String targetUrl = redirectBase
                + "?error=" + encode(error)
                + "&message=" + encode(message);

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    private String normalizeRedirectBaseUrl(HttpServletRequest request, String configured) {
        String value = (configured == null) ? "" : configured.trim();
        if (value.isEmpty()) {
            value = "/oauth2/redirect";
        }

        if (value.startsWith("http://") || value.startsWith("https://")) {
            return value;
        }

        if (!value.startsWith("/")) {
            value = "/" + value;
        }

        String origin = resolveRequestOrigin(request);
        return origin + value;
    }

    private String resolveRequestOrigin(HttpServletRequest request) {
        String proto = firstNonBlank(
                request.getHeader("X-Forwarded-Proto"),
                request.getHeader("x-forwarded-proto")
        );
        if (!StringUtils.hasText(proto)) {
            proto = request.isSecure() ? "https" : "http";
        }

        String host = firstNonBlank(
                request.getHeader("X-Forwarded-Host"),
                request.getHeader("x-forwarded-host"),
                request.getHeader("Host")
        );
        if (!StringUtils.hasText(host)) {
            host = request.getServerName();
            int port = request.getServerPort();
            boolean defaultPort = ("https".equalsIgnoreCase(proto) && port == 443) || ("http".equalsIgnoreCase(proto) && port == 80);
            if (!defaultPort && port > 0) {
                host = host + ":" + port;
            }
        }

        return proto + "://" + host;
    }

    private String firstNonBlank(String... values) {
        if (values == null) return null;
        for (String v : values) {
            if (StringUtils.hasText(v)) return v.trim();
        }
        return null;
    }

    private String encode(String value) {
        return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
    }
}

