-- Generated from Rails db/schema.rb. Domain tables only.

CREATE TABLE IF NOT EXISTS "addresses" (
  "id" bigserial PRIMARY KEY,
  "addressable_type" varchar,
  "addressable_id" bigint,
  "line1" varchar,
  "line2" varchar,
  "city" varchar,
  "state" varchar,
  "zip" varchar,
  "country" varchar,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "external_identifier" varchar NOT NULL,
  "deleted_at" timestamptz
);

CREATE TABLE IF NOT EXISTS "advice_decisions" (
  "id" bigserial PRIMARY KEY,
  "creator_id" bigint,
  "state" varchar,
  "title" varchar,
  "context" text,
  "proposal" text,
  "decide_by" timestamptz,
  "advice_by" timestamptz,
  "role" varchar,
  "final_summary" text,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "external_identifier" varchar NOT NULL,
  "changes_summary" text
);

CREATE TABLE IF NOT EXISTS "advice_events" (
  "id" bigserial PRIMARY KEY,
  "decision_id" bigint,
  "originator_type" varchar,
  "originator_id" bigint,
  "name" varchar,
  "description" varchar,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS "advice_messages" (
  "id" bigserial PRIMARY KEY,
  "decision_id" bigint,
  "sender_type" varchar,
  "sender_id" bigint,
  "stakeholder_id" bigint,
  "content" text,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "external_identifier" varchar NOT NULL
);

CREATE TABLE IF NOT EXISTS "advice_records" (
  "id" bigserial PRIMARY KEY,
  "decision_id" bigint,
  "stakeholder_id" bigint,
  "content" text,
  "status" varchar,
  "impede_your_role" varchar,
  "will_do_harm" varchar,
  "harm_hard_to_reverse" varchar,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS "advice_stakeholders" (
  "id" bigserial PRIMARY KEY,
  "decision_id" bigint,
  "person_id" bigint,
  "external_name" varchar,
  "external_email" varchar,
  "external_phone" varchar,
  "external_calendar_url" varchar,
  "external_roles" varchar,
  "external_subroles" varchar,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "external_identifier" varchar NOT NULL,
  "external_image_url" varchar
);

CREATE TABLE IF NOT EXISTS "audits" (
  "id" bigserial PRIMARY KEY,
  "auditable_id" integer,
  "auditable_type" varchar,
  "associated_id" integer,
  "associated_type" varchar,
  "user_id" integer,
  "user_type" varchar,
  "username" varchar,
  "action" varchar,
  "audited_changes" jsonb,
  "version" integer DEFAULT 0,
  "comment" varchar,
  "remote_address" varchar,
  "request_uuid" varchar,
  "created_at" timestamptz
);

CREATE TABLE IF NOT EXISTS "charters" (
  "id" bigserial PRIMARY KEY,
  "name" varchar,
  "external_identifier" varchar NOT NULL,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "deleted_at" timestamptz
);

CREATE TABLE IF NOT EXISTS "documents" (
  "id" bigserial PRIMARY KEY,
  "documentable_type" varchar,
  "documentable_id" bigint,
  "inheritance_type" varchar,
  "title" varchar,
  "link" varchar,
  "external_identifier" varchar NOT NULL,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "title_es" varchar
);

CREATE TABLE IF NOT EXISTS "hubs" (
  "id" bigserial PRIMARY KEY,
  "name" varchar,
  "entrepreneur_id" bigint,
  "external_identifier" varchar NOT NULL,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "deleted_at" timestamptz
);

CREATE TABLE IF NOT EXISTS "people" (
  "id" bigserial PRIMARY KEY,
  "email" varchar,
  "first_name" varchar,
  "last_name" varchar,
  "phone" varchar,
  "journey_state" varchar,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "external_identifier" varchar NOT NULL,
  "middle_name" varchar,
  "personal_email" varchar,
  "raw_address" varchar,
  "airtable_id" varchar,
  "hub_id" bigint,
  "pod_id" bigint,
  "about" text,
  "tc_user_id" varchar,
  "prosperworks_id" varchar,
  "willing_to_relocate" boolean,
  "primary_language" varchar,
  "race_ethnicity_other" varchar,
  "household_income" varchar,
  "income_background" varchar,
  "gender" varchar,
  "gender_other" varchar,
  "lgbtqia" boolean,
  "pronouns" varchar,
  "pronouns_other" varchar,
  "airtable_partner_id" varchar,
  "linkedin_url" varchar,
  "image_url" varchar,
  "primary_language_other" varchar,
  "montessori_certified" varchar,
  "affiliated_at" timestamptz,
  "show_ssj" boolean DEFAULT false,
  "active" boolean DEFAULT true,
  "start_date" date,
  "end_date" date,
  "preferred_name" varchar,
  "is_onboarded" boolean DEFAULT false,
  "platform_airtable_id" varchar,
  "airtable_sync_at" timestamptz,
  "deleted_at" timestamptz,
  "montessori_certified_year" varchar,
  "preferred_language" varchar
);

CREATE TABLE IF NOT EXISTS "people_relationships" (
  "id" bigserial PRIMARY KEY,
  "person_id_id" bigint,
  "other_person_id_id" bigint,
  "kind" varchar,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS "pods" (
  "id" bigserial PRIMARY KEY,
  "name" varchar,
  "hub_id" bigint,
  "primary_contact_id" bigint,
  "external_identifier" varchar NOT NULL,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "deleted_at" timestamptz
);

CREATE TABLE IF NOT EXISTS "school_relationships" (
  "id" bigserial PRIMARY KEY,
  "kind" varchar,
  "school_id" bigint,
  "person_id" bigint,
  "name" varchar,
  "description" text,
  "start_date" date,
  "end_date" date,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "external_identifier" varchar,
  "airtable_id" varchar,
  "platform_airtable_id" varchar,
  "airtable_sync_at" timestamptz,
  "deleted_at" timestamptz,
  "title" varchar
);

CREATE TABLE IF NOT EXISTS "schools" (
  "id" bigserial PRIMARY KEY,
  "name" varchar,
  "website" varchar,
  "phone" varchar,
  "email" varchar,
  "governance_type" varchar,
  "calendar" varchar,
  "max_enrollment" integer,
  "status" varchar,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "external_identifier" varchar NOT NULL,
  "pod_id" bigint,
  "short_name" varchar,
  "airtable_id" varchar,
  "facebook" varchar,
  "instagram" varchar,
  "timezone" varchar,
  "domain" varchar,
  "logo_url" varchar,
  "hub_id" bigint,
  "raw_address" varchar,
  "opened_on" date,
  "facility_type" varchar,
  "hero_image_url" varchar,
  "about" text,
  "about_es" text,
  "hero_image2_url" varchar,
  "charter_id" bigint,
  "charter_string" varchar,
  "closed_on" date,
  "affiliation_date" date,
  "num_classrooms" integer,
  "affiliated" boolean DEFAULT true,
  "platform_airtable_id" varchar,
  "airtable_sync_at" timestamptz,
  "deleted_at" timestamptz,
  "workflow_id" bigint,
  "expected_start_date" date,
  "directory_visible" boolean DEFAULT false NOT NULL
);

CREATE TABLE IF NOT EXISTS "ssj_team_members" (
  "id" bigserial PRIMARY KEY,
  "person_id" bigint,
  "ssj_team_id" bigint,
  "role" varchar,
  "status" varchar,
  "deleted_at" timestamptz
);

CREATE TABLE IF NOT EXISTS "ssj_teams" (
  "id" bigserial PRIMARY KEY,
  "external_identifier" varchar NOT NULL,
  "workflow_id" bigint,
  "expected_start_date" date,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "ops_guide_id" bigint,
  "regional_growth_lead_id" bigint,
  "deleted_at" timestamptz,
  "temp_name" varchar
);

CREATE TABLE IF NOT EXISTS "taggings" (
  "id" bigserial PRIMARY KEY,
  "tag_id" bigint,
  "taggable_type" varchar,
  "taggable_id" bigint,
  "tagger_type" varchar,
  "tagger_id" bigint,
  "context" varchar(128),
  "created_at" timestamptz,
  "tenant" varchar(128)
);

CREATE TABLE IF NOT EXISTS "tags" (
  "id" bigserial PRIMARY KEY,
  "name" varchar,
  "description" varchar,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "taggings_count" integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "users" (
  "id" bigserial PRIMARY KEY,
  "email" varchar DEFAULT '' NOT NULL,
  "encrypted_password" varchar DEFAULT '' NOT NULL,
  "reset_password_token" varchar,
  "reset_password_sent_at" timestamptz,
  "remember_created_at" timestamptz,
  "person_id" integer,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "external_identifier" varchar NOT NULL,
  "jti" varchar NOT NULL,
  "authentication_token" varchar(30),
  "authentication_token_created_at" timestamptz,
  "is_admin" boolean DEFAULT false,
  "deleted_at" timestamptz
);

CREATE TABLE IF NOT EXISTS "workflow_decision_options" (
  "id" bigserial PRIMARY KEY,
  "decision_id" bigint,
  "description" varchar,
  "external_identifier" varchar NOT NULL,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "description_es" varchar
);

CREATE TABLE IF NOT EXISTS "workflow_definition_dependencies" (
  "id" bigserial PRIMARY KEY,
  "workflow_id" bigint,
  "workable_type" varchar,
  "workable_id" bigint,
  "prerequisite_workable_type" varchar,
  "prerequisite_workable_id" bigint,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "deleted_at" timestamptz
);

CREATE TABLE IF NOT EXISTS "workflow_definition_processes" (
  "id" bigserial PRIMARY KEY,
  "version" varchar,
  "title" varchar,
  "description" text,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "published_at" timestamptz,
  "previous_version_id" bigint,
  "deleted_at" timestamptz,
  "recurring" boolean DEFAULT false,
  "due_months" integer[],
  "duration" integer,
  "title_es" varchar,
  "description_es" text
);

CREATE TABLE IF NOT EXISTS "workflow_definition_selected_processes" (
  "id" bigserial PRIMARY KEY,
  "workflow_id" bigint,
  "process_id" bigint,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "position" integer,
  "previous_version_id" bigint,
  "state" varchar,
  "deleted_at" timestamptz
);

CREATE TABLE IF NOT EXISTS "workflow_definition_steps" (
  "id" bigserial PRIMARY KEY,
  "process_id" bigint,
  "title" varchar,
  "description" text,
  "kind" varchar,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "position" integer,
  "min_worktime" integer DEFAULT 0,
  "max_worktime" integer DEFAULT 0,
  "completion_type" varchar,
  "decision_question" varchar,
  "deleted_at" timestamptz,
  "title_es" varchar,
  "description_es" text,
  "decision_question_es" varchar
);

CREATE TABLE IF NOT EXISTS "workflow_definition_workflows" (
  "id" bigserial PRIMARY KEY,
  "version_string" varchar,
  "name" varchar,
  "description" text,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "published_at" timestamptz,
  "previous_version_id" bigint,
  "rollout_started_at" timestamptz,
  "rollout_completed_at" timestamptz,
  "deleted_at" timestamptz,
  "needs_support" boolean DEFAULT false,
  "recurring" boolean DEFAULT false,
  "version" integer
);

CREATE TABLE IF NOT EXISTS "workflow_instance_dependencies" (
  "id" bigserial PRIMARY KEY,
  "definition_id" bigint,
  "workflow_id" bigint,
  "workable_type" varchar,
  "workable_id" bigint,
  "prerequisite_workable_type" varchar,
  "prerequisite_workable_id" bigint,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "deleted_at" timestamptz
);

CREATE TABLE IF NOT EXISTS "workflow_instance_processes" (
  "id" bigserial PRIMARY KEY,
  "definition_id" bigint,
  "workflow_id" bigint,
  "title" varchar,
  "description" text,
  "started_at" timestamptz,
  "completed_at" timestamptz,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "position" integer,
  "external_identifier" varchar NOT NULL,
  "steps_count" bigint,
  "completed_steps_count" integer DEFAULT 0 NOT NULL,
  "completion_status" integer DEFAULT 0,
  "dependency_cache" integer DEFAULT 0,
  "deleted_at" timestamptz,
  "suggested_start_date" date,
  "due_date" date,
  "recurring_type" varchar,
  "title_es" varchar,
  "description_es" text
);

CREATE TABLE IF NOT EXISTS "workflow_instance_step_assignments" (
  "id" bigserial PRIMARY KEY,
  "step_id" bigint NOT NULL,
  "assignee_id" bigint NOT NULL,
  "completed_at" timestamptz,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "selected_option_id" bigint
);

CREATE TABLE IF NOT EXISTS "workflow_instance_steps" (
  "id" bigserial PRIMARY KEY,
  "process_id" bigint,
  "definition_id" bigint,
  "title" varchar,
  "kind" varchar,
  "completed" boolean DEFAULT false,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "position" integer,
  "external_identifier" varchar NOT NULL,
  "assigned" boolean DEFAULT false,
  "completion_type" varchar,
  "description" text,
  "min_worktime" integer,
  "max_worktime" integer,
  "decision_question" varchar,
  "deleted_at" timestamptz,
  "title_es" varchar,
  "description_es" text,
  "decision_question_es" varchar
);

CREATE TABLE IF NOT EXISTS "workflow_instance_workflows" (
  "id" bigserial PRIMARY KEY,
  "definition_id" bigint,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "external_identifier" varchar NOT NULL,
  "current_phase" varchar DEFAULT 'visioning',
  "version" varchar,
  "deleted_at" timestamptz,
  "school_id" bigint,
  "visible" boolean DEFAULT true NOT NULL
);

CREATE INDEX IF NOT EXISTS "index_addresses_on_addressable" ON "addresses" ("addressable_type", "addressable_id");
CREATE INDEX IF NOT EXISTS "index_addresses_on_deleted_at" ON "addresses" ("deleted_at");
CREATE UNIQUE INDEX IF NOT EXISTS "index_addresses_on_external_identifier" ON "addresses" ("external_identifier");
CREATE INDEX IF NOT EXISTS "index_advice_decisions_on_creator_id" ON "advice_decisions" ("creator_id");
CREATE UNIQUE INDEX IF NOT EXISTS "index_advice_decisions_on_external_identifier" ON "advice_decisions" ("external_identifier");
CREATE INDEX IF NOT EXISTS "index_advice_events_on_decision_id" ON "advice_events" ("decision_id");
CREATE INDEX IF NOT EXISTS "index_advice_messages_on_decision_id" ON "advice_messages" ("decision_id");
CREATE UNIQUE INDEX IF NOT EXISTS "index_advice_messages_on_external_identifier" ON "advice_messages" ("external_identifier");
CREATE INDEX IF NOT EXISTS "index_advice_messages_on_stakeholder_id" ON "advice_messages" ("stakeholder_id");
CREATE INDEX IF NOT EXISTS "index_advice_records_on_decision_id" ON "advice_records" ("decision_id");
CREATE INDEX IF NOT EXISTS "index_advice_stakeholders_on_decision_id" ON "advice_stakeholders" ("decision_id");
CREATE UNIQUE INDEX IF NOT EXISTS "index_advice_stakeholders_on_external_identifier" ON "advice_stakeholders" ("external_identifier");
CREATE INDEX IF NOT EXISTS "associated_index" ON "audits" ("associated_type", "associated_id");
CREATE INDEX IF NOT EXISTS "auditable_index" ON "audits" ("auditable_type", "auditable_id", "version");
CREATE INDEX IF NOT EXISTS "index_audits_on_created_at" ON "audits" ("created_at");
CREATE INDEX IF NOT EXISTS "index_audits_on_request_uuid" ON "audits" ("request_uuid");
CREATE INDEX IF NOT EXISTS "user_index" ON "audits" ("user_id", "user_type");
CREATE INDEX IF NOT EXISTS "index_charters_on_deleted_at" ON "charters" ("deleted_at");
CREATE UNIQUE INDEX IF NOT EXISTS "index_charters_on_external_identifier" ON "charters" ("external_identifier");
CREATE INDEX IF NOT EXISTS "index_documents_on_documentable" ON "documents" ("documentable_type", "documentable_id");
CREATE INDEX IF NOT EXISTS "index_hubs_on_deleted_at" ON "hubs" ("deleted_at");
CREATE INDEX IF NOT EXISTS "index_hubs_on_entrepreneur_id" ON "hubs" ("entrepreneur_id");
CREATE UNIQUE INDEX IF NOT EXISTS "index_hubs_on_external_identifier" ON "hubs" ("external_identifier");
CREATE UNIQUE INDEX IF NOT EXISTS "index_hubs_on_name" ON "hubs" ("name");
CREATE UNIQUE INDEX IF NOT EXISTS "index_people_on_airtable_id" ON "people" ("airtable_id");
CREATE INDEX IF NOT EXISTS "index_people_on_deleted_at" ON "people" ("deleted_at");
CREATE UNIQUE INDEX IF NOT EXISTS "index_people_on_email" ON "people" ("email");
CREATE UNIQUE INDEX IF NOT EXISTS "index_people_on_external_identifier" ON "people" ("external_identifier");
CREATE INDEX IF NOT EXISTS "index_people_on_hub_id" ON "people" ("hub_id");
CREATE INDEX IF NOT EXISTS "index_people_on_pod_id" ON "people" ("pod_id");
CREATE INDEX IF NOT EXISTS "index_people_relationships_on_other_person_id_id" ON "people_relationships" ("other_person_id_id");
CREATE INDEX IF NOT EXISTS "index_people_relationships_on_person_id_id" ON "people_relationships" ("person_id_id");
CREATE INDEX IF NOT EXISTS "index_pods_on_deleted_at" ON "pods" ("deleted_at");
CREATE UNIQUE INDEX IF NOT EXISTS "index_pods_on_external_identifier" ON "pods" ("external_identifier");
CREATE INDEX IF NOT EXISTS "index_pods_on_hub_id" ON "pods" ("hub_id");
CREATE INDEX IF NOT EXISTS "index_pods_on_primary_contact_id" ON "pods" ("primary_contact_id");
CREATE UNIQUE INDEX IF NOT EXISTS "index_school_relationships_on_airtable_id" ON "school_relationships" ("airtable_id");
CREATE INDEX IF NOT EXISTS "index_school_relationships_on_deleted_at" ON "school_relationships" ("deleted_at");
CREATE INDEX IF NOT EXISTS "index_school_relationships_on_end_date" ON "school_relationships" ("end_date");
CREATE UNIQUE INDEX IF NOT EXISTS "index_school_relationships_on_external_identifier" ON "school_relationships" ("external_identifier");
CREATE INDEX IF NOT EXISTS "index_school_relationships_on_kind" ON "school_relationships" ("kind");
CREATE UNIQUE INDEX IF NOT EXISTS "index_school_relationships_on_person_id_and_school_id" ON "school_relationships" ("person_id", "school_id") WHERE ((deleted_at IS NULL) AND (end_date IS NULL));
CREATE INDEX IF NOT EXISTS "index_school_relationships_on_person_id" ON "school_relationships" ("person_id");
CREATE INDEX IF NOT EXISTS "index_school_relationships_on_school_active" ON "school_relationships" ("school_id", "deleted_at", "end_date") WHERE ((deleted_at IS NULL) AND (end_date IS NULL));
CREATE INDEX IF NOT EXISTS "index_school_relationships_on_school_kind_deleted_end" ON "school_relationships" ("school_id", "kind", "deleted_at", "end_date") WHERE (deleted_at IS NULL);
CREATE INDEX IF NOT EXISTS "index_school_relationships_on_school_id" ON "school_relationships" ("school_id");
CREATE UNIQUE INDEX IF NOT EXISTS "index_schools_on_airtable_id" ON "schools" ("airtable_id");
CREATE INDEX IF NOT EXISTS "index_schools_on_charter_id" ON "schools" ("charter_id");
CREATE INDEX IF NOT EXISTS "index_schools_on_deleted_at" ON "schools" ("deleted_at");
CREATE UNIQUE INDEX IF NOT EXISTS "index_schools_on_external_identifier" ON "schools" ("external_identifier");
CREATE INDEX IF NOT EXISTS "index_schools_on_hub_id" ON "schools" ("hub_id");
CREATE INDEX IF NOT EXISTS "index_schools_on_pod_id" ON "schools" ("pod_id");
CREATE UNIQUE INDEX IF NOT EXISTS "index_schools_on_workflow_id" ON "schools" ("workflow_id");
CREATE INDEX IF NOT EXISTS "index_ssj_team_members_on_deleted_at" ON "ssj_team_members" ("deleted_at");
CREATE INDEX IF NOT EXISTS "index_ssj_team_members_on_person_id" ON "ssj_team_members" ("person_id");
CREATE INDEX IF NOT EXISTS "index_ssj_team_members_on_ssj_team_id" ON "ssj_team_members" ("ssj_team_id");
CREATE INDEX IF NOT EXISTS "index_ssj_teams_on_deleted_at" ON "ssj_teams" ("deleted_at");
CREATE UNIQUE INDEX IF NOT EXISTS "index_ssj_teams_on_external_identifier" ON "ssj_teams" ("external_identifier");
CREATE INDEX IF NOT EXISTS "index_ssj_teams_on_ops_guide_id" ON "ssj_teams" ("ops_guide_id");
CREATE INDEX IF NOT EXISTS "index_ssj_teams_on_regional_growth_lead_id" ON "ssj_teams" ("regional_growth_lead_id");
CREATE INDEX IF NOT EXISTS "index_ssj_teams_on_workflow_id" ON "ssj_teams" ("workflow_id");
CREATE INDEX IF NOT EXISTS "index_taggings_on_context" ON "taggings" ("context");
CREATE UNIQUE INDEX IF NOT EXISTS "taggings_idx" ON "taggings" ("tag_id", "taggable_id", "taggable_type", "context", "tagger_id", "tagger_type");
CREATE INDEX IF NOT EXISTS "index_taggings_on_tag_id" ON "taggings" ("tag_id");
CREATE INDEX IF NOT EXISTS "taggings_taggable_context_idx" ON "taggings" ("taggable_id", "taggable_type", "context");
CREATE INDEX IF NOT EXISTS "taggings_idy" ON "taggings" ("taggable_id", "taggable_type", "tagger_id", "context");
CREATE INDEX IF NOT EXISTS "index_taggings_on_taggable_id" ON "taggings" ("taggable_id");
CREATE INDEX IF NOT EXISTS "index_taggings_on_taggable_type_and_taggable_id" ON "taggings" ("taggable_type", "taggable_id");
CREATE INDEX IF NOT EXISTS "index_taggings_on_taggable_type" ON "taggings" ("taggable_type");
CREATE INDEX IF NOT EXISTS "index_taggings_on_tagger_id_and_tagger_type" ON "taggings" ("tagger_id", "tagger_type");
CREATE INDEX IF NOT EXISTS "index_taggings_on_tagger_id" ON "taggings" ("tagger_id");
CREATE INDEX IF NOT EXISTS "index_taggings_on_tagger_type_and_tagger_id" ON "taggings" ("tagger_type", "tagger_id");
CREATE INDEX IF NOT EXISTS "index_taggings_on_tenant" ON "taggings" ("tenant");
CREATE UNIQUE INDEX IF NOT EXISTS "index_tags_on_name" ON "tags" ("name");
CREATE UNIQUE INDEX IF NOT EXISTS "index_users_on_authentication_token" ON "users" ("authentication_token");
CREATE INDEX IF NOT EXISTS "index_users_on_deleted_at" ON "users" ("deleted_at");
CREATE UNIQUE INDEX IF NOT EXISTS "index_users_on_email" ON "users" ("email");
CREATE UNIQUE INDEX IF NOT EXISTS "index_users_on_external_identifier" ON "users" ("external_identifier");
CREATE UNIQUE INDEX IF NOT EXISTS "index_users_on_jti" ON "users" ("jti");
CREATE UNIQUE INDEX IF NOT EXISTS "index_users_on_reset_password_token" ON "users" ("reset_password_token");
CREATE INDEX IF NOT EXISTS "index_workflow_decision_options_on_decision_id" ON "workflow_decision_options" ("decision_id");
CREATE UNIQUE INDEX IF NOT EXISTS "index_workflow_decision_options_on_external_identifier" ON "workflow_decision_options" ("external_identifier");
CREATE INDEX IF NOT EXISTS "index_workflow_definition_dependencies_on_deleted_at" ON "workflow_definition_dependencies" ("deleted_at");
CREATE INDEX IF NOT EXISTS "index_workflow_definition_dependencies_on_prerequisite_workable" ON "workflow_definition_dependencies" ("prerequisite_workable_type", "prerequisite_workable_id");
CREATE INDEX IF NOT EXISTS "index_workflow_definition_dependencies_on_workable" ON "workflow_definition_dependencies" ("workable_type", "workable_id");
CREATE INDEX IF NOT EXISTS "index_workflow_definition_dependencies_on_workflow_id" ON "workflow_definition_dependencies" ("workflow_id");
CREATE INDEX IF NOT EXISTS "index_workflow_definition_processes_on_deleted_at" ON "workflow_definition_processes" ("deleted_at");
CREATE INDEX IF NOT EXISTS "index_workflow_definition_selected_processes_on_deleted_at" ON "workflow_definition_selected_processes" ("deleted_at");
CREATE INDEX IF NOT EXISTS "index_workflow_definition_selected_processes_on_process_id" ON "workflow_definition_selected_processes" ("process_id");
CREATE INDEX IF NOT EXISTS "index_workflow_definition_selected_processes_on_workflow_id" ON "workflow_definition_selected_processes" ("workflow_id");
CREATE INDEX IF NOT EXISTS "index_workflow_definition_steps_on_deleted_at" ON "workflow_definition_steps" ("deleted_at");
CREATE INDEX IF NOT EXISTS "index_workflow_definition_steps_on_process_id" ON "workflow_definition_steps" ("process_id");
CREATE INDEX IF NOT EXISTS "index_workflow_definition_workflows_on_deleted_at" ON "workflow_definition_workflows" ("deleted_at");
CREATE INDEX IF NOT EXISTS "index_workflow_instance_dependencies_on_definition_id" ON "workflow_instance_dependencies" ("definition_id");
CREATE INDEX IF NOT EXISTS "index_workflow_instance_dependencies_on_deleted_at" ON "workflow_instance_dependencies" ("deleted_at");
CREATE INDEX IF NOT EXISTS "index_workflow_instance_dependencies_on_prerequisite_workable" ON "workflow_instance_dependencies" ("prerequisite_workable_type", "prerequisite_workable_id");
CREATE INDEX IF NOT EXISTS "index_workflow_instance_dependencies_on_workable" ON "workflow_instance_dependencies" ("workable_type", "workable_id");
CREATE INDEX IF NOT EXISTS "index_workflow_instance_dependencies_on_workflow_id" ON "workflow_instance_dependencies" ("workflow_id");
CREATE INDEX IF NOT EXISTS "index_workflow_instance_processes_on_definition_id" ON "workflow_instance_processes" ("definition_id");
CREATE INDEX IF NOT EXISTS "index_workflow_instance_processes_on_deleted_at" ON "workflow_instance_processes" ("deleted_at");
CREATE UNIQUE INDEX IF NOT EXISTS "index_workflow_instance_processes_on_external_identifier" ON "workflow_instance_processes" ("external_identifier");
CREATE INDEX IF NOT EXISTS "index_workflow_instance_processes_on_workflow_id" ON "workflow_instance_processes" ("workflow_id");
CREATE INDEX IF NOT EXISTS "index_workflow_instance_step_assignments_on_assignee_id" ON "workflow_instance_step_assignments" ("assignee_id");
CREATE INDEX IF NOT EXISTS "index_workflow_instance_step_assignments_on_step_id" ON "workflow_instance_step_assignments" ("step_id");
CREATE INDEX IF NOT EXISTS "index_workflow_instance_steps_on_definition_id" ON "workflow_instance_steps" ("definition_id");
CREATE INDEX IF NOT EXISTS "index_workflow_instance_steps_on_deleted_at" ON "workflow_instance_steps" ("deleted_at");
CREATE UNIQUE INDEX IF NOT EXISTS "index_workflow_instance_steps_on_external_identifier" ON "workflow_instance_steps" ("external_identifier");
CREATE INDEX IF NOT EXISTS "index_workflow_instance_steps_on_process_id" ON "workflow_instance_steps" ("process_id");
CREATE INDEX IF NOT EXISTS "index_workflow_instance_workflows_on_definition_id" ON "workflow_instance_workflows" ("definition_id");
CREATE INDEX IF NOT EXISTS "index_workflow_instance_workflows_on_deleted_at" ON "workflow_instance_workflows" ("deleted_at");
CREATE UNIQUE INDEX IF NOT EXISTS "index_workflow_instance_workflows_on_external_identifier" ON "workflow_instance_workflows" ("external_identifier");

ALTER TABLE "schools" DROP CONSTRAINT IF EXISTS "fk_schools_workflow_id";
ALTER TABLE "schools" ADD CONSTRAINT "fk_schools_workflow_id" FOREIGN KEY ("workflow_id") REFERENCES "workflow_instance_workflows" ("id");
ALTER TABLE "ssj_team_members" DROP CONSTRAINT IF EXISTS "fk_ssj_team_members_ssj_team_id";
ALTER TABLE "ssj_team_members" ADD CONSTRAINT "fk_ssj_team_members_ssj_team_id" FOREIGN KEY ("ssj_team_id") REFERENCES "ssj_teams" ("id");
ALTER TABLE "ssj_teams" DROP CONSTRAINT IF EXISTS "fk_ssj_teams_ops_guide_id";
ALTER TABLE "ssj_teams" ADD CONSTRAINT "fk_ssj_teams_ops_guide_id" FOREIGN KEY ("ops_guide_id") REFERENCES "people" ("id");
ALTER TABLE "ssj_teams" DROP CONSTRAINT IF EXISTS "fk_ssj_teams_regional_growth_lead_id";
ALTER TABLE "ssj_teams" ADD CONSTRAINT "fk_ssj_teams_regional_growth_lead_id" FOREIGN KEY ("regional_growth_lead_id") REFERENCES "people" ("id");
ALTER TABLE "ssj_teams" DROP CONSTRAINT IF EXISTS "fk_ssj_teams_workflow_id";
ALTER TABLE "ssj_teams" ADD CONSTRAINT "fk_ssj_teams_workflow_id" FOREIGN KEY ("workflow_id") REFERENCES "workflow_instance_workflows" ("id");
ALTER TABLE "taggings" DROP CONSTRAINT IF EXISTS "fk_taggings_tag_id";
ALTER TABLE "taggings" ADD CONSTRAINT "fk_taggings_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tags" ("id");
ALTER TABLE "workflow_instance_step_assignments" DROP CONSTRAINT IF EXISTS "fk_workflow_instance_step_assignments_step_id";
ALTER TABLE "workflow_instance_step_assignments" ADD CONSTRAINT "fk_workflow_instance_step_assignments_step_id" FOREIGN KEY ("step_id") REFERENCES "workflow_instance_steps" ("id");
