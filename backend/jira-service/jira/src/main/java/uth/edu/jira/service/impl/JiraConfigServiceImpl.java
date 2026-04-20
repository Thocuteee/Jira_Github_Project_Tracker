package uth.edu.jira.service.impl;

import uth.edu.jira.dto.JiraRequest;
import uth.edu.jira.dto.JiraResponse;
import uth.edu.jira.exception.ResourceNotFoundException;
import uth.edu.jira.mapper.JiraMapper;
import uth.edu.jira.model.Jira;
import uth.edu.jira.model.JiraSyncActivity;
import uth.edu.jira.repository.JiraRepository;
import uth.edu.jira.repository.JiraSyncActivityRepository;
import uth.edu.jira.service.JiraConfigService;
import uth.edu.jira.service.JiraClientProvider;
import uth.edu.jira.dto.GlobalJiraSettingRequest;
import uth.edu.jira.model.GlobalJiraSetting;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class JiraConfigServiceImpl implements JiraConfigService {

    private final JiraRepository jiraRepository;
    private final JiraMapper jiraMapper;
    private final JiraSyncActivityRepository activityRepository;
    private final JiraClientProvider jiraClientProvider;
    private final uth.edu.jira.repository.GlobalJiraSettingRepository globalSettingRepository;

    @Override
    @Transactional
    public JiraResponse createJiraConfig(JiraRequest dto) {
        log.info("Creating Jira config for groupId={}, projectKey={}",
                dto.getGroupId(), dto.getProjectKey());
        Jira saved = jiraRepository.save(jiraMapper.toEntity(dto));
        log.info("Jira config created id={}", saved.getJiraId());
        return jiraMapper.toDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public JiraResponse getJiraConfigById(UUID jiraId) {
        return jiraMapper.toDTO(findOrThrow(jiraId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<JiraResponse> getJiraConfigsByGroup(UUID groupId) {
        log.info("Fetching Jira configs for groupId={}", groupId);
        return jiraRepository.findByGroupId(groupId).stream()
                .map(jiraMapper::toDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<JiraResponse> getJiraConfigsByUser(UUID userId) {
        return jiraRepository.findByUserId(userId).stream()
                .map(jiraMapper::toDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public JiraResponse updateJiraConfig(UUID jiraId, JiraRequest dto) {
        log.info("Updating Jira config id={}", jiraId);
        Jira existing = findOrThrow(jiraId);
        existing.setUserId(dto.getUserId());
        existing.setJiraUrl(dto.getJiraUrl());
        existing.setProjectKey(dto.getProjectKey());
        existing.setGroupId(dto.getGroupId());
        return jiraMapper.toDTO(jiraRepository.save(existing));
    }

    @Override
    @Transactional
    public void deleteJiraConfig(UUID jiraId) {
        log.info("Deleting Jira config id={}", jiraId);
        jiraRepository.delete(findOrThrow(jiraId));
    }

    @Override
    @Transactional(readOnly = true)
    public boolean testConnection(UUID jiraId) {
        log.info("Testing global Jira connection...");
        try {
            jiraClientProvider.getClient().getMetadataClient().getServerInfo().claim();
            return true;
        } catch (Exception e) {
            log.error("Global connection test failed: {}", e.getMessage());
            return false;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<JiraSyncActivity> getRecentActivities() {
        return activityRepository.findRecentActivities();
    }

    @Override
    @Transactional
    public JiraResponse upsertMapping(UUID groupId, String projectKey) {
        log.info("Upserting Jira mapping for groupId={}, projectKey={}", groupId, projectKey);
        Optional<Jira> existing = jiraRepository.findByGroupId(groupId).stream().findFirst();
        
        Jira jira;
        if (existing.isPresent()) {
            jira = existing.get();
            jira.setProjectKey(projectKey);
            log.info("Updating existing Jira mapping id={}", jira.getJiraId());
        } else {
            jira = new Jira();
            jira.setGroupId(groupId);
            jira.setProjectKey(projectKey);
            jira.setJiraUrl(""); // Global URL will be used anyway
            log.info("Creating new Jira mapping");
        }
        
        return jiraMapper.toDTO(jiraRepository.save(jira));
    }

    @Override
    @Transactional
    public void saveGlobalSettings(GlobalJiraSettingRequest dto) {
        log.info("Saving global Jira settings: URL={}", dto.getJiraUrl());
        
        globalSettingRepository.deleteAll(); // Keep only one global setting
        
        GlobalJiraSetting entity = GlobalJiraSetting.builder()
                .jiraUrl(dto.getJiraUrl())
                .jiraUsername(dto.getJiraUsername())
                .jiraApiToken(dto.getJiraApiToken())
                .build();
        
        globalSettingRepository.save(entity);
        
        // Cập nhật kết nối Jira ngay lập tức
        jiraClientProvider.refreshClient();
    }

    private Jira findOrThrow(UUID jiraId) {
        return jiraRepository.findById(jiraId)
                .orElseThrow(() -> new ResourceNotFoundException("Jira config không tìm thấy: " + jiraId));
    }
}