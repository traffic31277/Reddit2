import React, { useState, useEffect } from 'react';
import { CloudWatchClient, GetMetricDataCommand } from "@aws-sdk/client-cloudwatch";
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';
import NavigationBar from "./navbar";


export default function MetricsDashboard() {
    const [metrics, setMetrics] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [lastUpdated, setLastUpdated] = useState('');

    const loadMetrics = async () => {
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
            const minutesBack = 60;

            // Determine the time range of the metrics 
            const currentDate = new Date();
            const oneHourAgo = new Date(currentDate.getTime() - minutesBack * 60 * 1000);

            // Using GetMetricData to request all the metric data
            const command = new GetMetricDataCommand ({
                StartTime: oneHourAgo,
                EndTime: currentDate,
                ScanBy: "TimestampAscending",
                
                // Include the metrics we want to query for from CloudWatch
                MetricDataQueries: [
                    // Total requests given to the server
                    {
                        Id: "total-requests",
                        Label: "Total Requests",
                        MetricStat: {
                            Metric: {
                                Namespace: namespace,
                                MetricName: "Requests",
                                Dimensions: [{ Name: amplifyAppName , Value: amplifyAppId }]
                            },
                            Period: 300, // Data points with a period of 300 seconds (5-minute) are available for 63 days.
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
                            Period: 300, // Data points with a period of 300 seconds (5-minute) are available for 63 days.
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
                            Period: 300, // Data points with a period of 300 seconds (5-minute) are available for 63 days.
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
                            Period: 300, // Data points with a period of 300 seconds (5-minute) are available for 63 days.
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
                            Period: 300, // Data points with a period of 300 seconds (5-minute) are available for 63 days.
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
                            Period: 300, // Data points with a period of 300 seconds (5-minute) are available for 63 days.
                            Stat: "Average",
                        },
                    },

                    // Calculate the % error rate of website
                    {
                        Id: "error_rate",
                        Label: "Error Rate (%)",
                        Expression: "IF(requests > 0, ((client_errors + server_errors) / requests) * 100, 0)"
                    },
                ],
            });

            // Receive the response from CloudWatch
            const response = await client.send(command);

            // Format the timestamp and values into rows
            const metricData: Record<string, any> = {};

            for (const metric of response.MetricDataResults || []) {
                metric.Timestamps?.forEach((timestamp, index) => {
                    const isoString = timestamp.toISOString();
                    if (!metricData[isoString]) {
                        metricData[isoString] = { timestamp: isoString }
                    }
                    metricData[isoString][metric.Id?] = metric.Values?.[index] ?? 0;
                });
            }

            const sortedMetrics = Object.values(metricData).sort(
                (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
            
            setMetrics(sortedMetrics);
            setLastUpdated(new Date().toLocaleDateString());
        }

        catch (err: any) {
            setError(err.message || "Could not pull metrics");
        }

        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMetrics();  // Pull the metrics everytime the page loads

        // Automatically refresh the page every 60 seconds
        const interval = setInterval(loadMetrics, 60_000);
        return () => clearInterval(interval);
    }, []);

    // Set the latest metrics
    const latest = metrics[metrics.length - 1] || {};

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
                        <h3>5xx Server Errors</h3>
                        <p>{latest.server_error ?? 0}</p>
                    </div>

                    <div>
                        <h3>4xx Client Errors</h3>
                        <p>{latest.client_error ?? 0}</p>
                    </div>
                    
                    {/* Recent History Table*/}
                    <table>
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
                            {metrics
                            .slice(-15)
                            .reverse()
                            .map((row) => (
                                <tr key={row.timestamp}>
                                    <td>{new Date(row.timestamp).toLocaleDateString()}</td>
                                    <td>{row.requests ?? 0}</td>
                                    <td>{row.client_error ?? 0}</td>
                                    <td>{row.server_error ?? 0}</td>
                                    <td>{Math.round(row.latency ?? 0)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <NavigationBar />
        </main>
    );
}