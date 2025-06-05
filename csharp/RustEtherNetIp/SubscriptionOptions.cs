using System;

namespace RustEtherNetIp
{
    /// <summary>
    /// Configuration options for tag subscriptions
    /// </summary>
    public class SubscriptionOptions
    {
        /// <summary>
        /// How often to poll the tag for updates (in milliseconds)
        /// </summary>
        public int PollIntervalMs { get; set; } = 100;

        /// <summary>
        /// Whether to buffer updates and only notify when the value changes
        /// </summary>
        public bool BufferUpdates { get; set; } = true;

        /// <summary>
        /// Maximum number of queued updates before dropping old ones
        /// </summary>
        public int MaxQueueSize { get; set; } = 100;

        /// <summary>
        /// Whether to automatically reconnect if the connection is lost
        /// </summary>
        public bool AutoReconnect { get; set; } = true;

        /// <summary>
        /// How long to wait before attempting to reconnect (in milliseconds)
        /// </summary>
        public int ReconnectDelayMs { get; set; } = 1000;

        /// <summary>
        /// Maximum number of reconnection attempts
        /// </summary>
        public int MaxReconnectAttempts { get; set; } = 10;

        /// <summary>
        /// Creates a new instance of SubscriptionOptions with default values
        /// </summary>
        public SubscriptionOptions() { }

        /// <summary>
        /// Creates a new instance of SubscriptionOptions with the specified poll interval
        /// </summary>
        /// <param name="pollIntervalMs">How often to poll the tag for updates (in milliseconds)</param>
        public SubscriptionOptions(int pollIntervalMs)
        {
            PollIntervalMs = pollIntervalMs;
        }
    }
} 