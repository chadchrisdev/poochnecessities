-- Step 1: Supabase schema for weight tracking
CREATE TABLE IF NOT EXISTS weights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id uuid REFERENCES dogs(id) ON DELETE CASCADE,
  weight_kg numeric NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  note text,
  created_at timestamptz DEFAULT now()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_weights_dog_id ON weights(dog_id); 