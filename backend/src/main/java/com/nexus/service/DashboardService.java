package com.nexus.service;

import com.nexus.dto.response.ResponseDTOs.*;
import com.nexus.enums.Priority;
import com.nexus.enums.ProjectStatus;
import com.nexus.enums.TaskStatus;
import com.nexus.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;

    public DashboardStats getDashboardStats() {
        long totalProjects = projectRepository.count();
        long activeProjects = projectRepository.countByStatus(ProjectStatus.ACTIVE);
        long completedProjects = projectRepository.countByStatus(ProjectStatus.COMPLETED);
        long onHoldProjects = projectRepository.countByStatus(ProjectStatus.ON_HOLD);
        long totalTasks = taskRepository.count();
        long completedTasks = taskRepository.countByStatus(TaskStatus.COMPLETED);
        long pendingTasks = taskRepository.countByStatus(TaskStatus.TODO) +
                           taskRepository.countByStatus(TaskStatus.IN_PROGRESS);
        long totalTeams = teamRepository.count();
        long totalMembers = userRepository.count();

        List<ProjectStatusCount> projectsByStatus = Arrays.stream(ProjectStatus.values())
            .map(status -> ProjectStatusCount.builder()
                .status(status.name())
                .count(projectRepository.countByStatus(status))
                .build())
            .collect(Collectors.toList());

        List<TaskPriorityCount> tasksByPriority = Arrays.stream(Priority.values())
            .map(priority -> TaskPriorityCount.builder()
                .priority(priority.name())
                .count(taskRepository.findAll().stream()
                    .filter(t -> t.getPriority() == priority).count())
                .build())
            .collect(Collectors.toList());

        // Build monthly activity for last 6 months (simplified - would normally use actual DB queries)
        List<MonthlyActivity> monthlyActivity = List.of(
            MonthlyActivity.builder().month("Jan").tasksCreated(15).tasksCompleted(12).build(),
            MonthlyActivity.builder().month("Feb").tasksCreated(22).tasksCompleted(18).build(),
            MonthlyActivity.builder().month("Mar").tasksCreated(28).tasksCompleted(24).build(),
            MonthlyActivity.builder().month("Apr").tasksCreated(19).tasksCompleted(21).build(),
            MonthlyActivity.builder().month("May").tasksCreated(32).tasksCompleted(27).build(),
            MonthlyActivity.builder().month("Jun").tasksCreated(25).tasksCompleted(22).build()
        );

        return DashboardStats.builder()
            .totalProjects(totalProjects)
            .activeProjects(activeProjects)
            .completedProjects(completedProjects)
            .onHoldProjects(onHoldProjects)
            .totalTasks(totalTasks)
            .completedTasks(completedTasks)
            .pendingTasks(pendingTasks)
            .overdueTasks(0L) // would calculate from DB
            .totalTeams(totalTeams)
            .totalMembers(totalMembers)
            .projectsByStatus(projectsByStatus)
            .tasksByPriority(tasksByPriority)
            .monthlyActivity(monthlyActivity)
            .build();
    }
}
