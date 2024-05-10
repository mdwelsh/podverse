import * as React from 'react';

export function ReportIssueTemplate({ email, issue }: { email?: string; issue: string }) {
  return (
    <div>
      <h1>Issue reported by Podverse user</h1>
      <p>Email: {email}</p>
      <p>Issue: {issue}</p>
    </div>
  );
}
