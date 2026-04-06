package uth.edu.auth.security.oauth2;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.stream.Collectors;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import uth.edu.auth.model.ERole;
import uth.edu.auth.model.Role;
import uth.edu.auth.model.User;
import uth.edu.auth.repository.RoleRepository;
import uth.edu.auth.repository.UserRepository;
import uth.edu.auth.security.JwtProvider;
import uth.edu.auth.service.RefreshTokenService;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
    private static final String ACCESS_TOKEN_COOKIE = "accessToken";
    private static final String REFRESH_TOKEN_COOKIE = "refreshToken";

    @Value("${auth.jwt.expiration}")
    private long accessTokenDurationMs;

    @Value("${uth.app.jwtRefreshExpirationMs}")
    private long refreshTokenDurationMs;

    @Value("${app.oauth2.redirectUri:http://localhost:5173/oauth2/redirect}")
    private String oauth2RedirectBaseUrl;

    @Autowired
    private JwtProvider jwtProvider;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException {
        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        String normalizedEmail = resolveOAuth2Email(oauth2User);
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseGet(() -> createOAuthUser(oauth2User, normalizedEmail));

        String accessToken = jwtProvider.generateJwtToken(user);
        String refreshToken = refreshTokenService.createRefreshToken(user.getUserId()).getToken();
        String roles = user.getRoles().stream().map(role -> role.getName().name()).collect(Collectors.joining(","));

        response.addHeader("Set-Cookie", buildTokenCookie(ACCESS_TOKEN_COOKIE, accessToken, accessTokenDurationMs).toString());
        response.addHeader("Set-Cookie", buildTokenCookie(REFRESH_TOKEN_COOKIE, refreshToken, refreshTokenDurationMs).toString());

        String targetUrl = String.format(
                "%s?email=%s&name=%s&roles=%s",
                oauth2RedirectBaseUrl,
                encode(normalizedEmail),
                encode(user.getName()),
                encode(roles)
        );
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    private String resolveOAuth2Email(OAuth2User oauth2User) {
        String email = oauth2User.getAttribute("email");
        if (StringUtils.hasText(email)) {
            return email.trim().toLowerCase();
        }
        String login = oauth2User.getAttribute("login");
        if (StringUtils.hasText(login)) {
            return (login.trim().toLowerCase() + "@users.noreply.github.com");
        }
        Object id = oauth2User.getAttribute("id");
        if (id != null) {
            return "github-" + id + "@oauth.local";
        }
        throw new RuntimeException("OAuth2 login không lấy được email hoặc login từ provider.");
    }

    private User createOAuthUser(OAuth2User oauth2User, String normalizedEmail) {
        String name = oauth2User.getAttribute("name");
        if (!StringUtils.hasText(name)) {
            name = oauth2User.getAttribute("login");
        }
        if (!StringUtils.hasText(name)) {
            name = normalizedEmail.split("@")[0];
        }
        Role memberRole = roleRepository.findByName(ERole.ROLE_TEAM_MEMBER)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy role mặc định ROLE_TEAM_MEMBER"));

        User user = new User();
        user.setEmail(normalizedEmail);
        user.setName(name);
        user.setPassword(new BCryptPasswordEncoder().encode("oauth2-user"));
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        user.setRoles(new HashSet<>());
        user.getRoles().add(memberRole);
        return userRepository.save(user);
    }

    private String encode(String value) {
        return java.net.URLEncoder.encode(value == null ? "" : value, java.nio.charset.StandardCharsets.UTF_8);
    }

    private ResponseCookie buildTokenCookie(String name, String value, long maxAgeMs) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/")
                .maxAge(maxAgeMs / 1000)
                .build();
    }
}
