package com.nexus.service;

import com.nexus.dto.request.AuthRequests.*;
import com.nexus.dto.response.ResponseDTOs.*;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    AuthResponse register(RegisterRequest request);
    AuthResponse refreshToken(String refreshToken);
    void changePassword(ChangePasswordRequest request, String email);
    void logout(String email);
}
