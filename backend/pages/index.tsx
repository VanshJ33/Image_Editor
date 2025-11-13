import type { NextPage } from 'next';
import Head from 'next/head';

const Home: NextPage = () => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
      padding: '2rem'
    }}>
      <Head>
        <title>Image Editor Backend API</title>
        <meta name="description" content="Backend API for Image Editor with Cloudinary integration" />
      </Head>
      
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
        Image Editor Backend API
      </h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Backend server is running successfully
      </p>
      
      <div style={{ 
        background: '#f5f5f5', 
        padding: '1.5rem', 
        borderRadius: '8px',
        maxWidth: '600px',
        width: '100%'
      }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>API Endpoints:</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li style={{ marginBottom: '0.5rem' }}>• <code>GET /api/health</code></li>
          <li style={{ marginBottom: '0.5rem' }}>• <code>POST /api/folder/create</code></li>
          <li style={{ marginBottom: '0.5rem' }}>• <code>GET /api/organization/[orgName]/check</code></li>
          <li style={{ marginBottom: '0.5rem' }}>• <code>POST /api/organization/[orgName]/create</code></li>
          <li style={{ marginBottom: '0.5rem' }}>• <code>GET /api/organization/[orgName]/images</code></li>
          <li style={{ marginBottom: '0.5rem' }}>• <code>POST /api/organization/[orgName]/upload</code></li>
          <li>• <code>GET /api/organization/[orgName]/image/[imageId]</code></li>
        </ul>
      </div>
    </div>
  );
};

export default Home;


