'use client';

import React from 'react';
import { withPageAuthRequired } from '@auth0/nextjs-auth0/client';
import Chat from '../../components/Chat';
export default withPageAuthRequired(function CSRPage() {
  return (
    <>
      <div className="mb-5" data-testid="csr">
        <h1 data-testid="csr-title">Sales Assistant</h1>
        <div data-testid="csr-text">
          <Chat />
        </div>
      </div>
    </>
  );
});
