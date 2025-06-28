-- Create medications table
CREATE TABLE IF NOT EXISTS public.medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dog_id UUID NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
    medication_name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency JSONB NOT NULL, -- Example: { "timesPerDay": 2, "intervalHours": 12 }
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for the medications table
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

-- Create a policy to ensure users can only access their own dogs' medications
CREATE POLICY "Users can only access their own dog's medications" 
ON public.medications
FOR ALL
USING (
    dog_id IN (
        SELECT id FROM public.dogs
        WHERE user_id = auth.uid()
    )
);

-- Create index for faster medication lookups by dog
CREATE INDEX medications_dog_id_idx ON public.medications(dog_id);

-- Create medication_library table
CREATE TABLE IF NOT EXISTS public.medication_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    dosage_form TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for medication_library table
ALTER TABLE public.medication_library ENABLE ROW LEVEL SECURITY;

-- Create policy for medication_library to be readable by all authenticated users
CREATE POLICY "Medication library visible to all authenticated users" 
ON public.medication_library
FOR SELECT
USING (auth.role() = 'authenticated');

-- Update activities table to add medication_id field
ALTER TABLE IF EXISTS public.activities
ADD COLUMN IF NOT EXISTS medication_id UUID REFERENCES public.medications(id) ON DELETE SET NULL;

-- We'll need a new trigger function to update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at maintenance
CREATE TRIGGER set_timestamp_medications
BEFORE UPDATE ON public.medications
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER set_timestamp_medication_library
BEFORE UPDATE ON public.medication_library
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Add comment to explain medications table
COMMENT ON TABLE public.medications IS 'Stores medication schedules for dogs';

-- Add comment to explain medication_library table
COMMENT ON TABLE public.medication_library IS 'Reference library of standard medications';

-- Add comment to explain the medication_id in activities
COMMENT ON COLUMN public.activities.medication_id IS 'Reference to a medication schedule if this activity is a medication administration'; 