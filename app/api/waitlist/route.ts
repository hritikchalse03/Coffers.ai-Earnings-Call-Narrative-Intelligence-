import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client (if env vars exist)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// In-memory fallback for local dev without Supabase
const localWaitlist: any[] = [];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, industry } = body;

    // Basic Validation
    if (!name || !email || !industry) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // MODE 1: SUPABASE
    if (supabase) {
      // Dedupe check
      const { data: existing } = await supabase
        .from('waitlist_signups')
        .select('email')
        .eq('email', email)
        .single();

      if (existing) {
        return NextResponse.json({ status: 'exists', message: 'Email already on waitlist' });
      }

      // Insert
      const { error } = await supabase
        .from('waitlist_signups')
        .insert([{ name, email, industry }]);

      if (error) {
        console.error('Supabase Error:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      return NextResponse.json({ status: 'success' });
    }

    // MODE 2: LOCAL FALLBACK
    // Check local dedupe
    if (localWaitlist.find(u => u.email === email)) {
       return NextResponse.json({ status: 'exists', mode: 'local' });
    }
    
    localWaitlist.push({ name, email, industry, date: new Date() });
    console.log('--- NEW WAITLIST SIGNUP (LOCAL) ---');
    console.log(localWaitlist[localWaitlist.length - 1]);
    console.log('-----------------------------------');

    return NextResponse.json({ status: 'success', mode: 'local' });

  } catch (err) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}