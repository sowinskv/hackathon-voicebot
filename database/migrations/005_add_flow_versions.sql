-- Flow Versions Table for Version History
CREATE TABLE flow_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
    language VARCHAR(10) NOT NULL CHECK (language IN ('pl', 'en')),
    system_prompt TEXT NOT NULL,
    flow_definition JSONB NOT NULL DEFAULT '{}',
    required_fields JSONB NOT NULL DEFAULT '[]',
    validation_rules JSONB DEFAULT '{}',
    created_by VARCHAR(100) DEFAULT 'system',
    created_at TIMESTAMP DEFAULT NOW(),

    -- Ensure unique version numbers per flow
    UNIQUE(flow_id, version)
);

-- Index for faster version lookups
CREATE INDEX idx_flow_versions_flow_id ON flow_versions(flow_id, version DESC);
CREATE INDEX idx_flow_versions_created_at ON flow_versions(created_at DESC);

-- Trigger function to automatically snapshot flow before update
CREATE OR REPLACE FUNCTION snapshot_flow_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Only snapshot if significant fields changed
    IF (OLD.system_prompt IS DISTINCT FROM NEW.system_prompt OR
        OLD.flow_definition IS DISTINCT FROM NEW.flow_definition OR
        OLD.required_fields IS DISTINCT FROM NEW.required_fields OR
        OLD.status IS DISTINCT FROM NEW.status) THEN

        -- Create snapshot of old version
        INSERT INTO flow_versions (
            flow_id,
            version,
            name,
            description,
            status,
            language,
            system_prompt,
            flow_definition,
            required_fields,
            validation_rules,
            created_by,
            created_at
        ) VALUES (
            OLD.id,
            OLD.version,
            OLD.name,
            OLD.description,
            OLD.status,
            OLD.language,
            OLD.system_prompt,
            OLD.flow_definition,
            OLD.required_fields,
            OLD.validation_rules,
            OLD.created_by,
            OLD.updated_at  -- Use old updated_at as version created_at
        )
        ON CONFLICT (flow_id, version) DO NOTHING;  -- Prevent duplicates

        -- Increment version number
        NEW.version = OLD.version + 1;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to flows table
DROP TRIGGER IF EXISTS snapshot_flow_before_update ON flows;
CREATE TRIGGER snapshot_flow_before_update
    BEFORE UPDATE ON flows
    FOR EACH ROW
    EXECUTE FUNCTION snapshot_flow_version();

-- Function to revert flow to a specific version
CREATE OR REPLACE FUNCTION revert_flow_to_version(
    p_flow_id UUID,
    p_version_id UUID
)
RETURNS TABLE(
    id UUID,
    name VARCHAR(255),
    description TEXT,
    version INTEGER,
    status VARCHAR(20),
    language VARCHAR(10),
    system_prompt TEXT,
    flow_definition JSONB,
    required_fields JSONB,
    validation_rules JSONB,
    created_by VARCHAR(100),
    published_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
) AS $$
DECLARE
    v_version_data RECORD;
BEGIN
    -- Get the version data
    SELECT * INTO v_version_data
    FROM flow_versions
    WHERE flow_versions.id = p_version_id AND flow_versions.flow_id = p_flow_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Version not found';
    END IF;

    -- Update the flow with version data (this will trigger snapshot of current version)
    UPDATE flows
    SET
        name = v_version_data.name,
        description = v_version_data.description,
        status = 'draft',  -- Always revert to draft
        system_prompt = v_version_data.system_prompt,
        flow_definition = v_version_data.flow_definition,
        required_fields = v_version_data.required_fields,
        validation_rules = v_version_data.validation_rules,
        updated_at = NOW()
    WHERE flows.id = p_flow_id;

    -- Return the updated flow
    RETURN QUERY
    SELECT f.* FROM flows f WHERE f.id = p_flow_id;
END;
$$ LANGUAGE plpgsql;

-- Snapshot all existing flows as their current version
INSERT INTO flow_versions (
    flow_id,
    version,
    name,
    description,
    status,
    language,
    system_prompt,
    flow_definition,
    required_fields,
    validation_rules,
    created_by,
    created_at
)
SELECT
    id,
    version,
    name,
    description,
    status,
    language,
    system_prompt,
    flow_definition,
    required_fields,
    validation_rules,
    created_by,
    created_at
FROM flows
ON CONFLICT (flow_id, version) DO NOTHING;

COMMENT ON TABLE flow_versions IS 'Historical snapshots of flow configurations for version control';
COMMENT ON FUNCTION snapshot_flow_version() IS 'Automatically creates a snapshot before updating a flow';
COMMENT ON FUNCTION revert_flow_to_version(UUID, UUID) IS 'Reverts a flow to a specific version from history';
