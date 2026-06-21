package com.nexus.service.impl;

import com.nexus.dto.request.CommentRequest;
import com.nexus.dto.response.ResponseDTOs.*;
import com.nexus.entity.Comment;
import com.nexus.entity.Task;
import com.nexus.entity.User;
import com.nexus.enums.ActivityType;
import com.nexus.exception.ResourceNotFoundException;
import com.nexus.exception.UnauthorizedException;
import com.nexus.repository.CommentRepository;
import com.nexus.repository.TaskRepository;
import com.nexus.service.ActivityLogService;
import com.nexus.service.CommentService;
import com.nexus.service.NotificationService;
import com.nexus.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final TaskRepository taskRepository;
    private final ActivityLogService activityLogService;
    private final NotificationService notificationService;
    private final SecurityUtils securityUtils;

    @Override
    public CommentResponse addComment(Long taskId, CommentRequest request) {
        User currentUser = securityUtils.getCurrentUser();
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new ResourceNotFoundException("Task", taskId));

        Comment comment = Comment.builder()
            .content(request.getContent())
            .task(task)
            .author(currentUser)
            .build();

        if (request.getParentCommentId() != null) {
            Comment parent = commentRepository.findById(request.getParentCommentId())
                .orElseThrow(() -> new ResourceNotFoundException("Comment", request.getParentCommentId()));
            comment.setParentComment(parent);
        }

        comment = commentRepository.save(comment);
        notificationService.notifyCommentAdded(task, currentUser);
        activityLogService.log(ActivityType.COMMENT_ADDED, "Comment added on task: " + task.getTitle(),
            "TASK", task.getId(), currentUser, task.getProject(), null, null);

        return mapToResponse(comment);
    }

    @Override
    public CommentResponse updateComment(Long id, CommentRequest request) {
        Comment comment = commentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Comment", id));
        User currentUser = securityUtils.getCurrentUser();

        if (!comment.getAuthor().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("You can only edit your own comments");
        }

        comment.setContent(request.getContent());
        comment.setIsEdited(true);
        return mapToResponse(commentRepository.save(comment));
    }

    @Override
    public void deleteComment(Long id) {
        Comment comment = commentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Comment", id));
        User currentUser = securityUtils.getCurrentUser();

        if (!comment.getAuthor().getId().equals(currentUser.getId()) && !securityUtils.isAdmin()) {
            throw new UnauthorizedException("You can only delete your own comments");
        }
        commentRepository.delete(comment);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<CommentResponse> getTaskComments(Long taskId, Pageable pageable) {
        Page<Comment> comments = commentRepository.findByTaskIdAndParentCommentIsNull(taskId, pageable);
        return PagedResponse.<CommentResponse>builder()
            .content(comments.getContent().stream().map(this::mapToResponse).collect(Collectors.toList()))
            .page(comments.getNumber()).size(comments.getSize())
            .totalElements(comments.getTotalElements()).totalPages(comments.getTotalPages())
            .last(comments.isLast()).first(comments.isFirst())
            .build();
    }

    private CommentResponse mapToResponse(Comment comment) {
        User author = comment.getAuthor();
        return CommentResponse.builder()
            .id(comment.getId())
            .content(comment.getContent())
            .author(UserResponse.builder()
                .id(author.getId()).firstName(author.getFirstName())
                .lastName(author.getLastName()).email(author.getEmail())
                .role(author.getRole()).avatarUrl(author.getAvatarUrl())
                .build())
            .parentCommentId(comment.getParentComment() != null ? comment.getParentComment().getId() : null)
            .isEdited(comment.getIsEdited())
            .createdAt(comment.getCreatedAt())
            .updatedAt(comment.getUpdatedAt())
            .build();
    }
}
