-- ==============================================================================
-- BioSync: Personal Digital Health Twin Database Schema
-- Supabase / PostgreSQL Architecture with Row Level Security (RLS)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    age INTEGER,
    baseline_window_days INTEGER DEFAULT 7,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Index on profiles user_id
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = user_id);


-- 2. HEALTH METRICS TABLE
CREATE TABLE IF NOT EXISTS public.health_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    sleep_hours NUMERIC(4,2) CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
    steps INTEGER CHECK (steps >= 0),
    resting_heart_rate INTEGER CHECK (resting_heart_rate >= 30 AND resting_heart_rate <= 220),
    exercise_minutes INTEGER CHECK (exercise_minutes >= 0 AND exercise_minutes <= 1440),
    mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 5),
    source TEXT NOT NULL CHECK (source IN ('manual', 'csv', 'health_connect', 'demo')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_health_metrics_user_date ON public.health_metrics(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_health_metrics_source ON public.health_metrics(source);

-- Enable RLS for health_metrics
ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own health metrics" 
    ON public.health_metrics FOR SELECT 
    USING (
        user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert own health metrics" 
    ON public.health_metrics FOR INSERT 
    WITH CHECK (
        user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update own health metrics" 
    ON public.health_metrics FOR UPDATE 
    USING (
        user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete own health metrics" 
    ON public.health_metrics FOR DELETE 
    USING (
        user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    );


-- 3. INSIGHTS TABLE
CREATE TABLE IF NOT EXISTS public.insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    insight_type TEXT NOT NULL,
    title TEXT NOT NULL,
    explanation TEXT NOT NULL,
    supporting_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    recommendation TEXT NOT NULL,
    is_dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for insights
CREATE INDEX IF NOT EXISTS idx_insights_user_date ON public.insights(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_insights_type ON public.insights(insight_type);

-- Enable RLS for insights
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own insights" 
    ON public.insights FOR SELECT 
    USING (
        user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert own insights" 
    ON public.insights FOR INSERT 
    WITH CHECK (
        user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update own insights" 
    ON public.insights FOR UPDATE 
    USING (
        user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    );


-- 4. BASELINES TABLE
CREATE TABLE IF NOT EXISTS public.baselines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    calculated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    window_days INTEGER NOT NULL DEFAULT 7,
    avg_sleep_hours NUMERIC(4,2),
    avg_steps NUMERIC(8,2),
    avg_resting_heart_rate NUMERIC(5,2),
    avg_exercise_minutes NUMERIC(6,2),
    metric_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_baselines_user ON public.baselines(user_id, calculated_at DESC);

ALTER TABLE public.baselines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own baselines" 
    ON public.baselines FOR SELECT 
    USING (
        user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert own baselines" 
    ON public.baselines FOR INSERT 
    WITH CHECK (
        user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    );
