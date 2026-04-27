package uth.edu.task.dto.response;

import lombok.Data;

@Data
public class MyTaskSummaryResponse {
    private long total;
    private long open;
    private long done;
    private long overdue;
}

