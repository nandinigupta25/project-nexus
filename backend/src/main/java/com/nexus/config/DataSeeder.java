package com.nexus.config;

import com.nexus.entity.*;
import com.nexus.enums.*;
import com.nexus.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataSeeder {

    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    @Profile("!test")
    public CommandLineRunner seedData() {
        return args -> {
            if (userRepository.count() > 0) {
                log.info("Database already seeded, skipping...");
                return;
            }

            log.info("Seeding database with initial data...");

            // Create Users
            User admin = userRepository.save(User.builder()
                .firstName("Alice").lastName("Admin")
                .email("admin@nexus.com")
                .password(passwordEncoder.encode("Admin@1234"))
                .role(Role.ADMIN).jobTitle("System Administrator")
                .isActive(true).build());

            User pm1 = userRepository.save(User.builder()
                .firstName("Bob").lastName("Manager")
                .email("pm@nexus.com")
                .password(passwordEncoder.encode("Manager@1234"))
                .role(Role.PROJECT_MANAGER).jobTitle("Project Manager")
                .isActive(true).build());

            User dev1 = userRepository.save(User.builder()
                .firstName("Carol").lastName("Developer")
                .email("dev1@nexus.com")
                .password(passwordEncoder.encode("Member@1234"))
                .role(Role.TEAM_MEMBER).jobTitle("Senior Developer")
                .isActive(true).build());

            User dev2 = userRepository.save(User.builder()
                .firstName("David").lastName("Smith")
                .email("dev2@nexus.com")
                .password(passwordEncoder.encode("Member@1234"))
                .role(Role.TEAM_MEMBER).jobTitle("Frontend Developer")
                .isActive(true).build());

            User designer = userRepository.save(User.builder()
                .firstName("Eva").lastName("Design")
                .email("designer@nexus.com")
                .password(passwordEncoder.encode("Member@1234"))
                .role(Role.TEAM_MEMBER).jobTitle("UI/UX Designer")
                .isActive(true).build());

            // Create Team
            Set<User> teamMembers = new HashSet<>(List.of(pm1, dev1, dev2, designer));
            Team team = teamRepository.save(Team.builder()
                .name("Alpha Squad").description("Core development team")
                .avatarColor("#6366f1").manager(pm1)
                .members(teamMembers).isActive(true).build());

            // Create Projects
            Set<User> projectMembers = new HashSet<>(List.of(dev1, dev2, designer));

            Project project1 = projectRepository.save(Project.builder()
                .name("Project Nexus Platform")
                .description("Building the next-generation project management dashboard with real-time collaboration features.")
                .status(ProjectStatus.ACTIVE).priority(Priority.HIGH)
                .startDate(LocalDate.now().minusMonths(2)).endDate(LocalDate.now().plusMonths(4))
                .progress(45).budget(150000.0).owner(pm1).team(team)
                .members(projectMembers).tags("platform,dashboard,react").build());

            Project project2 = projectRepository.save(Project.builder()
                .name("Mobile App Redesign")
                .description("Complete redesign of the mobile application with new UX patterns and improved performance.")
                .status(ProjectStatus.PLANNING).priority(Priority.MEDIUM)
                .startDate(LocalDate.now()).endDate(LocalDate.now().plusMonths(6))
                .progress(10).budget(75000.0).owner(pm1).team(team)
                .members(new HashSet<>(List.of(designer, dev1))).tags("mobile,ux,redesign").build());

            Project project3 = projectRepository.save(Project.builder()
                .name("API Integration Layer")
                .description("Developing a unified API integration layer for third-party service connections.")
                .status(ProjectStatus.ACTIVE).priority(Priority.CRITICAL)
                .startDate(LocalDate.now().minusMonths(1)).endDate(LocalDate.now().plusMonths(2))
                .progress(65).budget(50000.0).owner(admin).team(team)
                .members(new HashSet<>(List.of(dev1, dev2))).tags("api,integration,backend").build());

            // Create Tasks for project1
            List<Task> tasks = List.of(
                Task.builder().title("Set up backend architecture").description("Design and implement layered Spring Boot backend")
                    .status(TaskStatus.COMPLETED).priority(Priority.HIGH)
                    .dueDate(LocalDate.now().minusWeeks(2)).project(project1)
                    .assignee(dev1).reporter(pm1).position(0).build(),

                Task.builder().title("Design database schema").description("Create normalized ER diagram and implement JPA entities")
                    .status(TaskStatus.COMPLETED).priority(Priority.HIGH)
                    .dueDate(LocalDate.now().minusWeeks(3)).project(project1)
                    .assignee(dev1).reporter(pm1).position(1).build(),

                Task.builder().title("Implement JWT authentication").description("Add Spring Security with JWT token-based auth")
                    .status(TaskStatus.IN_PROGRESS).priority(Priority.CRITICAL)
                    .dueDate(LocalDate.now().plusDays(3)).project(project1)
                    .assignee(dev2).reporter(pm1).position(0).build(),

                Task.builder().title("Build React dashboard UI").description("Create main dashboard with charts and analytics widgets")
                    .status(TaskStatus.IN_PROGRESS).priority(Priority.HIGH)
                    .dueDate(LocalDate.now().plusWeeks(1)).project(project1)
                    .assignee(designer).reporter(pm1).position(1).build(),

                Task.builder().title("Implement Kanban board").description("Drag-and-drop kanban board with @dnd-kit")
                    .status(TaskStatus.TODO).priority(Priority.MEDIUM)
                    .dueDate(LocalDate.now().plusWeeks(2)).project(project1)
                    .assignee(dev2).reporter(pm1).position(0).build(),

                Task.builder().title("Write unit tests").description("Cover service layer with JUnit 5 tests")
                    .status(TaskStatus.TODO).priority(Priority.MEDIUM)
                    .dueDate(LocalDate.now().plusWeeks(3)).project(project1)
                    .assignee(dev1).reporter(pm1).position(1).build(),

                Task.builder().title("Docker configuration").description("Create Dockerfile and docker-compose for all services")
                    .status(TaskStatus.REVIEW).priority(Priority.LOW)
                    .dueDate(LocalDate.now().plusDays(7)).project(project1)
                    .assignee(dev1).reporter(pm1).position(0).build(),

                Task.builder().title("API documentation with Swagger").description("Document all REST endpoints with OpenAPI 3.0")
                    .status(TaskStatus.REVIEW).priority(Priority.LOW)
                    .dueDate(LocalDate.now().plusDays(5)).project(project1)
                    .assignee(dev2).reporter(pm1).position(1).build(),

                // Tasks for project3
                Task.builder().title("Design integration architecture").description("Plan the API gateway and service mesh")
                    .status(TaskStatus.COMPLETED).priority(Priority.CRITICAL)
                    .dueDate(LocalDate.now().minusWeeks(1)).project(project3)
                    .assignee(dev1).reporter(admin).position(0).build(),

                Task.builder().title("Implement OAuth2 connectors").description("Add OAuth2 integration for Google, GitHub, Slack")
                    .status(TaskStatus.IN_PROGRESS).priority(Priority.HIGH)
                    .dueDate(LocalDate.now().plusDays(10)).project(project3)
                    .assignee(dev2).reporter(admin).position(0).build()
            );

            taskRepository.saveAll(tasks);

            log.info("Database seeded successfully!");
            log.info("====== Default Credentials ======");
            log.info("Admin:    admin@nexus.com / Admin@1234");
            log.info("Manager:  pm@nexus.com / Manager@1234");
            log.info("Dev 1:    dev1@nexus.com / Member@1234");
            log.info("Dev 2:    dev2@nexus.com / Member@1234");
            log.info("Designer: designer@nexus.com / Member@1234");
            log.info("================================");
        };
    }
}
