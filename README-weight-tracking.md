# Weight Tracking Feature

This feature allows users to track their dog's weight over time, view the data in a chart, and add notes for each weight entry.

## Database Setup

1. Run the following SQL in your Supabase SQL Editor to create the required table:

```sql
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
```

2. Make sure your Supabase RLS (Row Level Security) policies allow proper access to this table.

## Features

- **Weight Entry**: Add weight data with optional notes
- **Chart Visualization**: View weight trends over time with a line chart
- **Time Filtering**: Filter the chart to show 1 month, 6 months, or all-time data
- **History List**: View all recorded weight entries with dates and notes

## Implementation Details

- Chart implemented using `react-native-chart-kit` and `react-native-svg`
- Data is stored in Supabase `weights` table
- Weight entries are associated with specific dogs via the `dog_id` foreign key
- Time-based filtering using date-fns for date manipulation

## Usage

1. Navigate to a dog's profile in the app
2. Tap on "Edit" or select a dog from the list
3. Scroll down to the Weight Tracking section
4. Enter a weight value and optional note
5. Tap "Add" to save the weight entry
6. Use the time range buttons to filter the chart data

## Component Structure

The main component `WeightTracking.js` handles:
- Fetching and displaying weight data
- Adding new weight entries
- Chart rendering and filtering
- History display

This component is integrated into the `EditDogScreen.js` and receives the `dogId` as a prop. 