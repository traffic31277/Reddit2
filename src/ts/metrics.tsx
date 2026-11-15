import React, { useState, useEffect } from 'react';
import { CloudWatchClient, GetMetricDataCommand } from "@aws-sdk/client-cloudwatch";
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';
import '../css/metrics.css';
import NavigationBar from "./navbar";
import { fetchAuthSession } from 'aws-amplify/auth';
import { Pass } from 'aws-cdk-lib/aws-stepfunctions';


const ADMIN_EMAILS = [
    'mdlmasenda@gmail.com',
    'brandonfortes@gmail.com',
];

function getRangeConfig(selectedRange: string) {
    const currentDate = new Date();
    const HOUR = 60 * 60 * 1000;
    const DAY = 24 * HOUR;

    switch (selectedRange) {
        case '1h':
            return { startTime: new Date(currentDate.getTime() - HOUR), period: 60 };
        case '24h':
            return { startTime: new Date(currentDate.getTime() - DAY), period: 300 };
        case '7d':
            return { startTime: new Date(currentDate.getTime() - 7 * DAY), period: 3600 };
        case 'all':
            return { startTime: new Date(currentDate.getTime() - 455 * DAY), period: 86400 };
        default:
            // 455 days is the maximum for CloudWatch (15-months)
            return { startTime: new Date(currentDate.getTime() - 455 * DAY), period: 86400}
    }
}

export default function MetricsDashboard() {
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [metrics, setMetrics] = useState<any[]>([]);
    const [range, setRange] = useState<'1h' | '24h' | '7d' | 'all'>('24h');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [lastUpdated, setLastUpdated] = useState('');

    // Async function to pull all metrics from CloudWatch
    const loadMetrics = async () => {
        console.log("Trying to load metrics");
        try {
            // Access the CloudWatch Client
            const client = new CloudWatchClient({
                region: "us-east-2",
                credentials: fromCognitoIdentityPool({
                    identityPoolId: 'us-east-2:12e12612-5d7f-4e29-b566-432accd9bcca',
                }),
            });

            // All the constants for the metrics
            const namespace = "AWS/AmplifyHosting";
            const amplifyAppName = "Reddit2";
            const amplifyAppId = "d2doi1xqfq91i";

            // Determine the time range of the metrics 
            const { startTime, period } = getRangeConfig(range);

            // Using GetMetricData to request all the metric data
            const command = new GetMetricDataCommand ({
                StartTime: startTime,
                EndTime: new Date(),
                ScanBy: "TimestampAscending",
                
                // Include the metrics we want to query for from CloudWatch
                MetricDataQueries: [
                    // Total requests given to the server
                    {
                        Id: "total_requests",
                        Label: "Total Requests",
                        MetricStat: {
                            Metric: {
                                Namespace: namespace,
                                MetricName: "Requests",
                                Dimensions: [{ Name: amplifyAppName , Value: amplifyAppId }]
                            },
                            Period: period, // Data points with a period of 300 seconds (5-minute) are available for 63 days.
                            Stat: "Sum",
                        },
                    },

                    // Total amount of errors given to the client
                    {
                        Id: "client_errors",
                        Label: "4xx Client Errors",
                        MetricStat: {
                            Metric: {
                                Namespace: namespace,
                                MetricName: "4xxErrors",
                                Dimensions: [{ Name: amplifyAppName , Value: amplifyAppId }]
                            },
                            Period: period, // Data points with a period of 300 seconds (5-minute) are available for 63 days.
                            Stat: "Sum",
                        },
                    },

                    // Total amount of errors caused by the Server
                    {
                        Id: "server_errors",
                        Label: "5xx Server Errors",
                        MetricStat: {
                            Metric: {
                                Namespace: namespace,
                                MetricName: "5xxErrors",
                                Dimensions: [{ Name: amplifyAppName , Value: amplifyAppId }]
                            },
                            Period: period, // Data points with a period of 300 seconds (5-minute) are available for 63 days.
                            Stat: "Sum"
                        },
                    },

                    // Current bytes downloaded to the app
                    {
                        Id: "bytes_downloaded",
                        Label: "Bytes Downloaded",
                        MetricStat: {
                            Metric: {
                                Namespace: namespace,
                                MetricName: "BytesDownloaded",
                                Dimensions: [{ Name: amplifyAppName , Value: amplifyAppId }]
                            },
                            Period: period, // Data points with a period of 300 seconds (5-minute) are available for 63 days.
                            Stat: "Sum",
                        },
                    },

                    // Current bytes uploaded to the app
                    {
                        Id: "bytes_uploaded",
                        Label: "Bytes Uploaded",
                        MetricStat: {
                            Metric: {
                                Namespace: namespace,
                                MetricName: "BytesUploaded",
                                Dimensions: [{ Name: amplifyAppName , Value: amplifyAppId }]
                            },
                            Period: period, // Data points with a period of 300 seconds (5-minute) are available for 63 days.
                            Stat: "Sum",
                        },
                    },

                    // Current latency of the app
                    {
                        Id: "latency",
                        Label: "Avg Latency (ms)",
                        MetricStat: {
                            Metric: {
                                Namespace: namespace,
                                MetricName: "Latency",
                                Dimensions: [{ Name: amplifyAppName , Value: amplifyAppId }]
                            },
                            Period: period, // Data points with a period of 300 seconds (5-minute) are available for 63 days.
                            Stat: "Average",
                        },
                    },

                    // Calculate the % error rate of website
                    {
                        Id: "error_rate",
                        Label: "Error Rate (%)",
                        Expression: "IF(total_requests > 0, ((client_errors + server_errors) / total_requests) * 100, 0)"
                    },
                ],
            });

            // Receive the response from CloudWatch
            const response = await client.send(command);
            console.log("RAW client response: ", JSON.stringify(response, null, 2));

            // Format the timestamp and values into rows
            const metricData: Record<string, any> = {};

            for (const metric of response.MetricDataResults || []) {
                metric.Timestamps?.forEach((timestamp, index) => {
                    const isoString = timestamp.toISOString();
                    if (!metricData[isoString]) {
                        metricData[isoString] = { timestamp: isoString }
                    }
                    metricData[isoString][metric.Id!] = metric.Values?.[index] ?? 0;
                });
            }

            const sortedMetrics = Object.values(metricData).sort(
                (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
            
            setMetrics(sortedMetrics);
            setLastUpdated(new Date().toLocaleDateString());
        }

        catch (err: any) {
            console.error("The try function failed: ", err.message);
            setError(err.message || "Could not pull metrics");
        }

        finally {
            setLoading(false);
        }
    };

    // Check if user is an Admin, if so allow them to view the metrics
    useEffect(() => {
        async function checkAdmin() {
            try {
                const session = await fetchAuthSession();

                const userEmail = session.tokens?.idToken?.payload?.email as string | undefined;
                console.log("Admin email: ", session.tokens?.idToken?.payload?.email as string | undefined);

                if (!userEmail || !ADMIN_EMAILS.includes(userEmail.toLowerCase())) {
                    setIsAdmin(false);
                    return;
                }

                setIsAdmin(true);
                loadMetrics();
            }

            catch (err: any) {
                setIsAdmin(false);
                console.error("The current user is not an admin", err.message);
            }
        }

        checkAdmin();
    }, []);

    if (isAdmin === null) {
        return (
            <main>
                <p>Checking admin permissions...</p>
            </main>
        )
    }

    else {
        Pass
    }

    if (!isAdmin) {
        return (
            <main>
                <h1>Access Denied</h1>
                <p>You do not have permissions to view this dashboard</p>
            </main>
        )
    }

    else {
        Pass
    }

    console.log("After the admin check");

    useEffect(() => {
        loadMetrics();  // Pull the metrics everytime the page loads

        // Automatically refresh the page every 60 seconds
        const interval = setInterval(loadMetrics, 60_000);
        return () => clearInterval(interval);
    }, []);

    // Set the latest metrics
    const latest = metrics[metrics.length - 1] || {};

    console.log("Trying to load the metrics: ", latest);

    return (
        <main>
            <h1>Admin Metrics Dashboard</h1>
            <p>Last Updated: {lastUpdated || 'Loading...'}</p>

            {error && <div className="error_message">{error}</div>}

            <div>
                <button className="suggestion_button" onClick={loadMetrics}>
                    Refresh Current Metrics
                </button>
            </div>

            {loading ? (
                <p>Loading metrics...</p>
            ) : (
                <div>
                    <div>
                        <h3>Amplify Requests (Last Min)</h3>
                        <p>{latest.requests ?? 0}</p>
                    </div>

                    <div>
                        <h3>Server Errors</h3>
                        <p>{latest.server_error ?? 0}</p>
                    </div>

                    <div>
                        <h3>Client Errors</h3>
                        <p>{latest.client_error ?? 0}</p>
                    </div>


                    {/* Recent History Table*/}
                    <div className='metrics_table_container'>
                        <table className='metrics_table'>
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Requests</th>
                                    <th>Client Error</th>
                                    <th>Server Error</th>
                                    <th>Latency (ms)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {metrics.length === 0 ? (
                                    <tr>
                                        <td colSpan={5}>
                                            There is no metric data available at the time.
                                        </td>
                                    </tr>
                                ) : (
                                    metrics
                                        .slice(-15)
                                        .reverse()
                                        .map((row) => (
                                            <tr key={row.timestamp}>
                                                <td>{range === '1h' || range === '24h'
                                                ? new Date(row.timestamp).toLocaleTimeString()
                                                : new Date(row.timestamp).toLocaleTimeString()}</td>
                                                <td>{row.requests ?? 0}</td>
                                                <td>{row.client_error ?? 0}</td>
                                                <td>{row.server_error ?? 0}</td>
                                                <td>{Math.round(row.latency ?? 0)}</td>
                                            </tr>
                                        ))
                                    )}
                            </tbody>
                        </table>
                    </div>

                    <div>
                        <button className='suggestion_button' onClick={() => setRange('1h')}>
                            1 Hour
                        </button>

                        <button className='suggestion_button' onClick={() => setRange('24h')}>
                            24 Hours
                        </button>

                        <button className='suggestion_button' onClick={() => setRange('7d')}>
                            7 Days
                        </button>
                        
                        <button className='suggestion_button' onClick={() => setRange('all')}>
                            All Time
                        </button>
                    </div>
                </div>
            )}

            <NavigationBar />
        </main>
    );
}