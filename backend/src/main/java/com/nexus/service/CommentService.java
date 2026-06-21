package com.nexus.service;
import com.nexus.dto.request.CommentRequest;
import com.nexus.dto.response.ResponseDTOs.*;
import org.springframework.data.domain.Pageable;
public interface CommentService {
    CommentResponse addComment(Long taskId, CommentRequest request);
    CommentResponse updateComment(Long id, CommentRequest request);
    void deleteComment(Long id);
    PagedResponse<CommentResponse> getTaskComments(Long taskId, Pageable pageable);
}
