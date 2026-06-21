package com.nexus.service;

import com.nexus.dto.request.AuthRequests.LoginRequest;
import com.nexus.dto.request.AuthRequests.RegisterRequest;
import com.nexus.dto.response.ResponseDTOs.AuthResponse;
import com.nexus.entity.User;
import com.nexus.enums.Role;
import com.nexus.exception.DuplicateResourceException;
import com.nexus.repository.UserRepository;
import com.nexus.security.JwtTokenProvider;
import com.nexus.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtTokenProvider jwtTokenProvider;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private UserDetailsService userDetailsService;
    @Mock private ActivityLogService activityLogService;

    @InjectMocks
    private AuthServiceImpl authService;

    private User testUser;
    private UserDetails mockUserDetails;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
            .firstName("John").lastName("Doe")
            .email("john@nexus.com")
            .password("encodedPassword")
            .role(Role.TEAM_MEMBER)
            .isActive(true)
            .build();

        mockUserDetails = org.springframework.security.core.userdetails.User.builder()
            .username("john@nexus.com")
            .password("encodedPassword")
            .authorities("ROLE_TEAM_MEMBER")
            .build();
    }

    @Test
    void login_ValidCredentials_ReturnsAuthResponse() {
        LoginRequest request = new LoginRequest();
        request.setEmail("john@nexus.com");
        request.setPassword("password123");

        when(userRepository.findByEmail("john@nexus.com")).thenReturn(Optional.of(testUser));
        when(userDetailsService.loadUserByUsername("john@nexus.com")).thenReturn(mockUserDetails);
        when(jwtTokenProvider.generateToken(any())).thenReturn("access-token");
        when(jwtTokenProvider.generateRefreshToken(any())).thenReturn("refresh-token");
        when(jwtTokenProvider.getExpirationTime()).thenReturn(86400000L);
        doNothing().when(activityLogService).log(any(), any(), any(), any(), any());

        AuthResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("access-token");
        assertThat(response.getUser().getEmail()).isEqualTo("john@nexus.com");
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    void register_NewEmail_ReturnsAuthResponse() {
        RegisterRequest request = new RegisterRequest();
        request.setFirstName("Jane");
        request.setLastName("Doe");
        request.setEmail("jane@nexus.com");
        request.setPassword("SecurePass@123");

        when(userRepository.existsByEmail("jane@nexus.com")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(userDetailsService.loadUserByUsername(any())).thenReturn(mockUserDetails);
        when(jwtTokenProvider.generateToken(any())).thenReturn("access-token");
        when(jwtTokenProvider.generateRefreshToken(any())).thenReturn("refresh-token");
        when(jwtTokenProvider.getExpirationTime()).thenReturn(86400000L);

        AuthResponse response = authService.register(request);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isNotNull();
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_DuplicateEmail_ThrowsDuplicateResourceException() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("existing@nexus.com");

        when(userRepository.existsByEmail("existing@nexus.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
            .isInstanceOf(DuplicateResourceException.class)
            .hasMessageContaining("Email already registered");
    }
}
