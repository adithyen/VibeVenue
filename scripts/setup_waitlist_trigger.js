const sql = `
CREATE OR REPLACE FUNCTION public.handle_cancellation_auto_promote()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  promoted_id uuid;
BEGIN
  -- When a confirmed registration is cancelled
  IF (TG_OP = 'UPDATE' AND OLD.status = 'confirmed' AND NEW.status = 'cancelled') THEN
    -- Find earliest waitlisted registration for this event
    SELECT id INTO promoted_id
    FROM public.registrations
    WHERE event_id = NEW.event_id AND status = 'waitlisted'
    ORDER BY registered_at ASC
    LIMIT 1;

    IF (promoted_id IS NOT NULL) THEN
      UPDATE public.registrations
      SET status = 'confirmed', updated_at = NOW()
      WHERE id = promoted_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_cancellation_auto_promote ON public.registrations;

CREATE TRIGGER trigger_cancellation_auto_promote
AFTER UPDATE ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION public.handle_cancellation_auto_promote();
`;

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN || '';
  const res = await fetch('https://api.supabase.com/v1/projects/yrvijufespplklfnvsfg/database/query', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });
  const data = await res.json();
  console.log('Postgres Auto-Promote Trigger Result:', data);
}

main();
