-- Add foreign key constraint between safety_alerts and profiles
ALTER TABLE public.safety_alerts 
ADD CONSTRAINT fk_safety_alerts_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);

-- Add foreign key constraint between panic_alerts and profiles  
ALTER TABLE public.panic_alerts 
ADD CONSTRAINT fk_panic_alerts_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);

-- Add foreign key constraint between public_emergency_alerts and profiles
ALTER TABLE public.public_emergency_alerts 
ADD CONSTRAINT fk_public_emergency_alerts_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);