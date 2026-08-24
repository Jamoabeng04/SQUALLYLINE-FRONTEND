// // hooks/useAgentContext.js

// import { useEffect, useState } from 'react';
// import { API_BASE_URL } from '../providers/AuthProvider';

// export function useAgentContext() {
//     const [agent, setAgent] = useState(null);
//     const [isValidSubdomain, setIsValidSubdomain] = useState(true);
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         const checkSubdomain = async () => {
//             const hostname = window.location.hostname;
//             const domain = 'lvh.me';
            
//             // Main site - no subdomain
//             if (hostname === domain || hostname === `www.${domain}`) {
//                 console.log('🔵 Main site detected');
//                 setIsValidSubdomain(true);
//                 setAgent(null);
//                 setLoading(false);
//                 return;
//             }
            
//             // Check if it's a subdomain
//             if (hostname.endsWith(`.${domain}`)) {
//                 const storeUrl = hostname.replace(`.${domain}`, '');
//                 console.log(`🟡 Checking subdomain: ${storeUrl}`);
//                 console.log(`🟡 API_BASE_URL: ${API_BASE_URL}`);
                
//                 try {
//                     const response = await fetch(
//                         `${API_BASE_URL}/accounts/agent-by-store/?store_url=${storeUrl}`
//                     );
//                     const data = await response.json();
                    
//                     console.log(`🟡 Agent check response:`, data);
                    
//                     if (data.exists) {
//                         console.log(`✅ Valid agent found: ${storeUrl}`);
//                         setIsValidSubdomain(true);
//                         setAgent(data.data);
//                     } else {
//                         console.log(`❌ Invalid agent subdomain: ${storeUrl}`);
//                         setIsValidSubdomain(false);
//                         window.location.href = `http://${domain}`;
//                     }
//                 } catch (error) {
//                     console.error('❌ Error checking agent:', error);
//                     setIsValidSubdomain(false);
//                     window.location.href = `http://${domain}`;
//                 }
//             }
            
//             setLoading(false);
//         };
        
//         checkSubdomain();
//     }, []);

//     return { agent, isValidSubdomain, loading };
// }


















// hooks/useAgentContext.js

import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../providers/AuthProvider';

export function useAgentContext() {
    const [agent, setAgent] = useState(null);
    const [isValidSubdomain, setIsValidSubdomain] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkSubdomain = async () => {
            const hostname = window.location.hostname;
            
            // ============================================================
            // DEVELOPMENT - lvh.me
            // ============================================================
            if (hostname === 'lvh.me' || hostname === 'www.lvh.me') {
                console.log('🔵 Main site detected (lvh.me)');
                setIsValidSubdomain(true);
                setAgent(null);
                setLoading(false);
                return;
            }
            
            if (hostname.endsWith('.lvh.me')) {
                const storeUrl = hostname.replace('.lvh.me', '');
                console.log(`🟡 Checking subdomain: ${storeUrl}`);
                console.log(`🟡 API_BASE_URL: ${API_BASE_URL}`);
                
                try {
                    const response = await fetch(
                        `${API_BASE_URL}/accounts/agent-by-store/?store_url=${storeUrl}`
                    );
                    const data = await response.json();
                    
                    if (data.exists) {
                        console.log(`✅ Valid agent found: ${storeUrl}`);
                        setIsValidSubdomain(true);
                        setAgent(data.data);
                    } else {
                        console.log(`❌ Invalid agent subdomain: ${storeUrl}`);
                        setIsValidSubdomain(false);
                        window.location.href = 'http://lvh.me';
                    }
                } catch (error) {
                    console.error('❌ Error checking agent:', error);
                    setIsValidSubdomain(false);
                    window.location.href = 'http://lvh.me';
                }
                
                setLoading(false);
                return;
            }
            
            // ============================================================
            // PRODUCTION - azoemart.com (Main Site)
            // ============================================================
            if (hostname === 'azoemart.com' || hostname === 'www.azoemart.com') {
                console.log('🔵 Main site detected (azoemart.com)');
                setIsValidSubdomain(true);
                setAgent(null);
                setLoading(false);
                return;
            }
            
            // ============================================================
            // PRODUCTION - *.azoeshop.store (Agent Sites)
            // ============================================================
            if (hostname.endsWith('.azoeshop.store')) {
                const storeUrl = hostname.replace('.azoeshop.store', '');
                console.log(`🟡 Checking agent store: ${storeUrl}`);
                console.log(`🟡 API_BASE_URL: ${API_BASE_URL}`);
                
                try {
                    const response = await fetch(
                        `${API_BASE_URL}/accounts/agent-by-store/?store_url=${storeUrl}`
                    );
                    const data = await response.json();
                    
                    if (data.exists) {
                        console.log(`✅ Valid agent found: ${storeUrl}`);
                        setIsValidSubdomain(true);
                        setAgent(data.data);
                    } else {
                        console.log(`❌ Invalid agent store: ${storeUrl}`);
                        setIsValidSubdomain(false);
                        window.location.href = 'https://azoemart.com';
                    }
                } catch (error) {
                    console.error('❌ Error checking agent:', error);
                    setIsValidSubdomain(false);
                    window.location.href = 'https://azoemart.com';
                }
                
                setLoading(false);
                return;
            }
            
            // ============================================================
            // PRODUCTION - *.azoemart.com (Other Subdomains like api)
            // ============================================================
            if (hostname.endsWith('.azoemart.com')) {
                // If it's api.azoemart.com, treat as main site (no agent context)
                if (hostname === 'api.azoemart.com') {
                    console.log('🔵 API site detected (api.azoemart.com) - no agent context');
                    setIsValidSubdomain(true);
                    setAgent(null);
                    setLoading(false);
                    return;
                }
                
                // Other subdomains - treat as main site
                console.log(`🔵 Subdomain of azoemart.com: ${hostname} - treating as main site`);
                setIsValidSubdomain(true);
                setAgent(null);
                setLoading(false);
                return;
            }
            
            // ============================================================
            // Unknown domain - fallback
            // ============================================================
            console.log(`⚠️ Unknown domain: ${hostname} - treating as main site`);
            setIsValidSubdomain(true);
            setAgent(null);
            setLoading(false);
        };
        
        checkSubdomain();
    }, []);

    return { agent, isValidSubdomain, loading };
}