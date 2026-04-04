package uth.edu.task.service;

import uth.edu.task.dto.request.TaskAssignRequest;
import uth.edu.task.dto.request.TaskCreateRequest;
import uth.edu.task.dto.request.TaskStatusUpdateRequest;
import uth.edu.task.dto.request.TaskUpdateRequest;
import uth.edu.task.dto.response.TaskResponse;

import java.util.List;
import java.util.UUID;

public interface TaskService {

    TaskResponse createTask(TaskCreateRequest request);

    TaskResponse getTaskById(UUID taskId);



    List<TaskResponse> getTasksByRequirementId(UUID requirementId);

    TaskResponse updateTask(UUID taskId, TaskUpdateRequest request);

    TaskResponse assignTask(UUID taskId, TaskAssignRequest request);

    TaskResponse changeTaskStatus(UUID taskId, TaskStatusUpdateRequest request);

    void deleteTask(UUID taskId);

}
