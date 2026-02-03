-- Seed default safety_alert template if missing in existing schema
INSERT INTO public.notification_templates (id, name, type, title_template, body_template, email_template, sms_template, push_template, default_channels, default_priority, variables, is_active, created_at, updated_at)
SELECT gen_random_uuid(), 'safety_alert', 'alert', 'Safety Alert: {{title}}', '{{description}}',
       '<h2>{{title}}</h2><p><strong>Severity:</strong> {{severity}}</p><p>{{description}}</p><p><strong>Location:</strong> {{address}}</p><p style="color:#888">Sent at {{timestamp}}</p>',
       '[{{severity}}] {{title}} - {{description}} @ {{address}}',
       jsonb_build_object('title', '{{title}}', 'body', '{{description}}'),
       ARRAY['push','email'], 'medium', '{}', true, now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.notification_templates WHERE name = 'safety_alert' AND type = 'alert'
);
